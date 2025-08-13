const { pool } = require('../config/database');
const NotificationService = require('./NotificationService');

class WorkflowService {
    // Define workflow stages and their order
    static WORKFLOW_STAGES = [
        'supervision_consent',
        'course_registration', 
        'gec_formation',
        'comprehensive_exam',
        'synopsis_defense',
        'research_candidacy',
        'thesis_writing',
        'thesis_evaluation',
        'thesis_defense',
        'graduation'
    ];

    // Define required forms for each stage
    static STAGE_REQUIREMENTS = {
        'supervision_consent': ['PHDEE02-A'],
        'course_registration': ['PHDEE02-B'],
        'gec_formation': ['PHDEE02-C'],
        'comprehensive_exam': ['PHDEE03', 'PHDEE1'],
        'synopsis_defense': ['PHDEE04-A', 'PHDEE04-B', 'PHDEE2-A', 'PHDEE2-B'],
        'research_candidacy': ['PHDEE04-C'],
        'thesis_writing': ['PHDEE3'],
        'thesis_evaluation': ['PHDEE2-C', 'PHDEE3-A', 'PHDEE3-B', 'PHDEE4', 'PHDEE4-A'],
        'thesis_defense': ['PHDEE05-A', 'PHDEE5', 'PHDEE05-B', 'PHDEE6'],
        'graduation': ['PHDEE-COMPLETION', 'PHDEE-TRANSCRIPT']
    };

    // Get student's current workflow status
    static async getStudentWorkflowStatus(studentId) {
        try {
            const query = `
                SELECT 
                    swp.*,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.student_id,
                    u.enrollment_year
                FROM student_workflow_progress swp
                JOIN users u ON swp.student_id = u.id
                WHERE swp.student_id = $1
            `;

            const result = await pool.query(query, [studentId]);
            
            if (result.rows.length === 0) {
                // Initialize workflow for new student
                return await this.initializeStudentWorkflow(studentId);
            }

            const progress = result.rows[0];

            // Get completed forms for current stage
            const formsQuery = `
                SELECT 
                    ft.form_code,
                    ft.form_name,
                    fs.status,
                    fs.submitted_at,
                    fs.dec_approval_status,
                    fs.supervisor_approval_status,
                    fs.gec_approval_status,
                    fs.hod_approval_status,
                    fs.chairperson_approval_status
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                WHERE fs.user_id = $1 AND ft.workflow_stage = $2
                ORDER BY fs.submitted_at DESC
            `;

            const formsResult = await pool.query(formsQuery, [studentId, progress.current_stage]);
            progress.stage_forms = formsResult.rows;

            // Calculate stage completion percentage
            const requiredForms = this.STAGE_REQUIREMENTS[progress.current_stage] || [];
            const completedForms = formsResult.rows.filter(form => form.status === 'approved');
            progress.completion_percentage = requiredForms.length > 0 
                ? Math.round((completedForms.length / requiredForms.length) * 100) 
                : 0;

            // Check if stage is ready for completion
            progress.can_advance = await this.canAdvanceToNextStage(studentId, progress.current_stage);

            return progress;

        } catch (error) {
            console.error('Error fetching student workflow status:', error);
            throw error;
        }
    }

    // Initialize workflow for new student
    static async initializeStudentWorkflow(studentId) {
        try {
            const currentYear = new Date().getFullYear();
            const academicYear = `${currentYear}-${currentYear + 1}`;

            const insertQuery = `
                INSERT INTO student_workflow_progress (
                    student_id, 
                    current_stage, 
                    academic_year, 
                    current_semester
                ) VALUES ($1, $2, $3, $4)
                RETURNING *
            `;

            const result = await pool.query(insertQuery, [
                studentId, 
                'supervision_consent', 
                academicYear, 
                '1st'
            ]);

            // Create welcome notification
            await NotificationService.createNotification({
                userId: studentId,
                title: 'Welcome to PhD Research Tracking',
                message: 'Your workflow has been initialized. Please start by completing the Supervisor Consent Form (PHDEE02-A).',
                notificationType: 'info',
                actionRequired: true
            });

            return result.rows[0];

        } catch (error) {
            console.error('Error initializing student workflow:', error);
            throw error;
        }
    }

    // Check if student can advance to next stage
    static async canAdvanceToNextStage(studentId, currentStage) {
        try {
            const requiredForms = this.STAGE_REQUIREMENTS[currentStage] || [];
            
            if (requiredForms.length === 0) {
                return true;
            }

            // Check if all required forms are approved
            const checkQuery = `
                SELECT 
                    ft.form_code,
                    fs.status,
                    fs.dec_approval_status,
                    fs.supervisor_approval_status,
                    fs.gec_approval_status,
                    fs.hod_approval_status,
                    fs.chairperson_approval_status,
                    ft.requires_dec_approval,
                    ft.requires_supervisor_approval,
                    ft.requires_gec_approval,
                    ft.requires_hod_approval,
                    ft.requires_chairperson_approval
                FROM form_types ft
                LEFT JOIN form_submissions fs ON ft.id = fs.form_type_id AND fs.user_id = $1
                WHERE ft.form_code = ANY($2) AND ft.workflow_stage = $3
            `;

            const result = await pool.query(checkQuery, [studentId, requiredForms, currentStage]);
            
            for (const form of result.rows) {
                if (!form.status || form.status !== 'approved') {
                    return false;
                }

                // Check specific approval requirements
                if (form.requires_dec_approval && form.dec_approval_status !== 'approved') {
                    return false;
                }
                if (form.requires_supervisor_approval && form.supervisor_approval_status !== 'approved') {
                    return false;
                }
                if (form.requires_gec_approval && form.gec_approval_status !== 'approved') {
                    return false;
                }
                if (form.requires_hod_approval && form.hod_approval_status !== 'approved') {
                    return false;
                }
                if (form.requires_chairperson_approval && form.chairperson_approval_status !== 'approved') {
                    return false;
                }
            }

            // Special stage-specific validations
            return await this.validateStageSpecificRequirements(studentId, currentStage);

        } catch (error) {
            console.error('Error checking stage advancement:', error);
            throw error;
        }
    }

    // Stage-specific validation logic
    static async validateStageSpecificRequirements(studentId, stage) {
        try {
            switch (stage) {
                case 'comprehensive_exam':
                    // Check if comprehensive exam is passed
                    const examQuery = `
                        SELECT exam_status, overall_result 
                        FROM comprehensive_exams 
                        WHERE student_id = $1 
                        ORDER BY created_at DESC 
                        LIMIT 1
                    `;
                    const examResult = await pool.query(examQuery, [studentId]);
                    return examResult.rows.length > 0 && examResult.rows[0].overall_result === 'pass';

                case 'synopsis_defense':
                    // Check if synopsis defense is passed
                    const synopsisQuery = `
                        SELECT defense_status, overall_result 
                        FROM thesis_defenses 
                        WHERE student_id = $1 AND defense_type = 'synopsis'
                        ORDER BY created_at DESC 
                        LIMIT 1
                    `;
                    const synopsisResult = await pool.query(synopsisQuery, [studentId]);
                    return synopsisResult.rows.length > 0 && synopsisResult.rows[0].overall_result === 'pass';

                case 'thesis_defense':
                    // Check if all defense types are passed
                    const defenseQuery = `
                        SELECT defense_type, overall_result 
                        FROM thesis_defenses 
                        WHERE student_id = $1 AND overall_result = 'pass'
                    `;
                    const defenseResult = await pool.query(defenseQuery, [studentId]);
                    const passedDefenses = defenseResult.rows.map(d => d.defense_type);
                    return passedDefenses.includes('in_house') && passedDefenses.includes('public');

                default:
                    return true;
            }

        } catch (error) {
            console.error('Error validating stage requirements:', error);
            return false;
        }
    }

    // Advance student to next stage
    static async advanceStudentToNextStage(studentId, currentStage, adminId = null) {
        try {
            // Check if advancement is allowed
            const canAdvance = await this.canAdvanceToNextStage(studentId, currentStage);
            if (!canAdvance) {
                throw new Error('Student does not meet requirements to advance to next stage');
            }

            // Get next stage
            const currentIndex = this.WORKFLOW_STAGES.indexOf(currentStage);
            if (currentIndex === -1 || currentIndex === this.WORKFLOW_STAGES.length - 1) {
                throw new Error('Invalid current stage or student already at final stage');
            }

            const nextStage = this.WORKFLOW_STAGES[currentIndex + 1];

            // Mark current stage as completed and advance
            const updateQuery = `
                UPDATE student_workflow_progress 
                SET 
                    is_stage_completed = true,
                    stage_completion_date = CURRENT_TIMESTAMP,
                    current_stage = $1,
                    stage_start_date = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE student_id = $2
                RETURNING *
            `;

            const result = await pool.query(updateQuery, [nextStage, studentId]);

            if (result.rows.length === 0) {
                throw new Error('Student workflow not found');
            }

            // Create advancement notification
            const nextStageRequiredForms = this.STAGE_REQUIREMENTS[nextStage] || [];
            await NotificationService.createNotification({
                userId: studentId,
                title: `Advanced to ${nextStage.replace('_', ' ').toUpperCase()} Stage`,
                message: `Congratulations! You have advanced to the ${nextStage} stage. Required forms: ${nextStageRequiredForms.join(', ')}`,
                notificationType: 'success',
                actionRequired: nextStageRequiredForms.length > 0
            });

            // Log the advancement
            if (adminId) {
                await this.logWorkflowAction(studentId, 'stage_advancement', {
                    from_stage: currentStage,
                    to_stage: nextStage,
                    advanced_by: adminId
                });
            }

            return result.rows[0];

        } catch (error) {
            console.error('Error advancing student stage:', error);
            throw error;
        }
    }

    // Get all available next forms for student
    static async getAvailableFormsForStudent(studentId) {
        try {
            const workflowStatus = await this.getStudentWorkflowStatus(studentId);
            const currentStage = workflowStatus.current_stage;

            // Get forms for current stage that haven't been submitted yet
            const availableFormsQuery = `
                SELECT 
                    ft.id,
                    ft.form_code,
                    ft.form_name,
                    ft.description,
                    ft.requires_supervisor_approval,
                    ft.requires_dec_approval,
                    ft.requires_gec_approval,
                    CASE 
                        WHEN fs.id IS NOT NULL THEN fs.status
                        ELSE 'draft'
                    END as current_status,
                    fs.submitted_at,
                    fs.id as submission_id
                FROM form_types ft
                LEFT JOIN (
                    SELECT DISTINCT ON (form_type_id) 
                        form_type_id, id, status, submitted_at
                    FROM form_submissions 
                    WHERE user_id = $1
                    ORDER BY form_type_id, submitted_at DESC
                ) fs ON ft.id = fs.form_type_id
                WHERE ft.workflow_stage = $2 AND ft.is_active = true
                ORDER BY ft.form_code
            `;

            const result = await pool.query(availableFormsQuery, [studentId, currentStage]);

            // Check prerequisites for each form
            const formsWithPrerequisites = await Promise.all(
                result.rows.map(async (form) => {
                    const prerequisites = await this.checkFormPrerequisites(studentId, form.form_code);
                    return {
                        ...form,
                        prerequisites_met: prerequisites.met,
                        missing_prerequisites: prerequisites.missing
                    };
                })
            );

            return {
                currentStage,
                canAdvanceToNext: workflowStatus.can_advance,
                forms: formsWithPrerequisites
            };

        } catch (error) {
            console.error('Error getting available forms:', error);
            throw error;
        }
    }

    // Check form prerequisites
    static async checkFormPrerequisites(studentId, formCode) {
        try {
            const formQuery = `
                SELECT prerequisite_forms 
                FROM form_types 
                WHERE form_code = $1
            `;

            const formResult = await pool.query(formQuery, [formCode]);
            
            if (formResult.rows.length === 0 || !formResult.rows[0].prerequisite_forms) {
                return { met: true, missing: [] };
            }

            const prerequisiteForms = formResult.rows[0].prerequisite_forms;

            // Check if all prerequisite forms are completed
            const checkQuery = `
                SELECT ft.form_code
                FROM form_types ft
                LEFT JOIN form_submissions fs ON ft.id = fs.form_type_id AND fs.user_id = $1
                WHERE ft.form_code = ANY($2)
                AND (fs.status IS NULL OR fs.status != 'approved')
            `;

            const missingResult = await pool.query(checkQuery, [studentId, prerequisiteForms]);
            const missingForms = missingResult.rows.map(row => row.form_code);

            return {
                met: missingForms.length === 0,
                missing: missingForms
            };

        } catch (error) {
            console.error('Error checking prerequisites:', error);
            return { met: false, missing: [] };
        }
    }

    // Update semester information
    static async updateStudentSemester(studentId, semester, academicYear) {
        try {
            const updateQuery = `
                UPDATE student_workflow_progress 
                SET 
                    semester = $1,
                    academic_year = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE student_id = $3
                RETURNING *
            `;

            const result = await pool.query(updateQuery, [semester, academicYear, studentId]);

            if (result.rows.length === 0) {
                throw new Error('Student workflow not found');
            }

            return result.rows[0];

        } catch (error) {
            console.error('Error updating student semester:', error);
            throw error;
        }
    }

    // Get workflow analytics for admin dashboard
    static async getWorkflowAnalytics() {
        try {
            // Stage distribution with better error handling
            const stageDistributionQuery = `
                SELECT 
                    swp.current_stage as stage,
                    COUNT(*) as count,
                    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - swp.stage_start_date))/86400) as avg_days_in_stage
                FROM student_workflow_progress swp
                JOIN users u ON swp.student_id = u.id
                WHERE u.is_active = true
                GROUP BY swp.current_stage
                ORDER BY 
                    CASE swp.current_stage
                        WHEN 'supervision_consent' THEN 1
                        WHEN 'course_registration' THEN 2
                        WHEN 'gec_formation' THEN 3
                        WHEN 'comprehensive_exam' THEN 4
                        WHEN 'synopsis_defense' THEN 5
                        WHEN 'research_candidacy' THEN 6
                        WHEN 'thesis_writing' THEN 7
                        WHEN 'thesis_evaluation' THEN 8
                        WHEN 'thesis_defense' THEN 9
                        WHEN 'graduation' THEN 10
                        ELSE 11
                    END
            `;

            // Completion rates by stage
            const completionRatesQuery = `
                SELECT 
                    swp.current_stage as stage,
                    COUNT(*) as total_students,
                    COUNT(CASE WHEN swp.is_stage_completed THEN 1 END) as completed_students,
                    COALESCE(
                        ROUND(
                            COUNT(CASE WHEN swp.is_stage_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2
                        ), 0
                    ) as completion_rate
                FROM student_workflow_progress swp
                JOIN users u ON swp.student_id = u.id
                WHERE u.is_active = true
                GROUP BY swp.current_stage
            `;

            // Average time per stage
            const averageTimeQuery = `
                SELECT 
                    ft.workflow_stage as stage,
                    AVG(EXTRACT(EPOCH FROM (COALESCE(fs.approved_at, fs.submitted_at) - fs.submitted_at))/86400) as avg_approval_days,
                    COUNT(*) as total_submissions
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                WHERE fs.status = 'approved'
                GROUP BY ft.workflow_stage
            `;

            let stageDistribution = { rows: [] };
            let completionRates = { rows: [] };
            let averageTime = { rows: [] };

            try {
                const results = await Promise.all([
                    pool.query(stageDistributionQuery),
                    pool.query(completionRatesQuery),
                    pool.query(averageTimeQuery)
                ]);

                stageDistribution = results[0];
                completionRates = results[1];
                averageTime = results[2];

            } catch (error) {
                console.warn('Error fetching analytics data:', error.message);
                // Provide default analytics data
                stageDistribution.rows = [
                    { stage: 'supervision_consent', count: 0, avg_days_in_stage: 0 },
                    { stage: 'course_registration', count: 0, avg_days_in_stage: 0 },
                    { stage: 'gec_formation', count: 0, avg_days_in_stage: 0 }
                ];
                completionRates.rows = [
                    { stage: 'supervision_consent', total_students: 0, completed_students: 0, completion_rate: 0 },
                    { stage: 'course_registration', total_students: 0, completed_students: 0, completion_rate: 0 },
                    { stage: 'gec_formation', total_students: 0, completed_students: 0, completion_rate: 0 }
                ];
                averageTime.rows = [];
            }

            // Convert completion rates to a more usable format
            const completionRatesObj = {};
            completionRates.rows.forEach(row => {
                completionRatesObj[row.stage] = parseFloat(row.completion_rate) || 0;
            });

            return {
                stage_distribution: stageDistribution.rows.map(row => ({
                    stage: row.stage,
                    count: parseInt(row.count) || 0,
                    avg_days_in_stage: parseFloat(row.avg_days_in_stage) || 0
                })),
                completion_rates: completionRatesObj,
                average_time_per_stage: averageTime.rows.map(row => ({
                    stage: row.stage,
                    avg_approval_days: parseFloat(row.avg_approval_days) || 0,
                    total_submissions: parseInt(row.total_submissions) || 0
                })),
                // Add some basic computed metrics
                avg_processing_time: averageTime.rows.length > 0 
                    ? (averageTime.rows.reduce((sum, row) => sum + (parseFloat(row.avg_approval_days) || 0), 0) / averageTime.rows.length).toFixed(1) + ' days'
                    : '0 days',
                success_rate: completionRates.rows.length > 0
                    ? (completionRates.rows.reduce((sum, row) => sum + (parseFloat(row.completion_rate) || 0), 0) / completionRates.rows.length).toFixed(1) + '%'
                    : '0%',
                active_users: stageDistribution.rows.reduce((sum, row) => sum + (parseInt(row.count) || 0), 0),
                system_uptime: '99.9%' // This would normally come from monitoring system
            };

        } catch (error) {
            console.error('Error getting workflow analytics:', error);
            // Return default analytics structure
            return {
                stage_distribution: [],
                completion_rates: {},
                average_time_per_stage: [],
                avg_processing_time: '0 days',
                success_rate: '0%',
                active_users: 0,
                system_uptime: '99.9%'
            };
        }
    }

    // Log workflow actions for audit trail
    static async logWorkflowAction(studentId, action, metadata = {}) {
        try {
            // This could be expanded to a separate audit log table
            // For now, we'll create a notification
            await NotificationService.createNotification({
                userId: studentId,
                title: 'Workflow Action',
                message: `Action: ${action}`,
                notificationType: 'info',
                actionRequired: false
            });

        } catch (error) {
            console.error('Error logging workflow action:', error);
            // Don't throw error for logging failures
        }
    }

    // Get students requiring attention (stuck in stages too long)
    static async getStudentsRequiringAttention(daysThreshold = 90) {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.email,
                    u.student_id,
                    swp.current_stage,
                    swp.stage_start_date,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - swp.stage_start_date))/86400 as days_in_stage,
                    swp.semester,
                    swp.academic_year
                FROM student_workflow_progress swp
                JOIN users u ON swp.student_id = u.id
                WHERE u.is_active = true 
                AND swp.stage_start_date < CURRENT_TIMESTAMP - INTERVAL '${daysThreshold} days'
                AND NOT swp.is_stage_completed
                ORDER BY days_in_stage DESC
            `;

            const result = await pool.query(query);
            return result.rows;

        } catch (error) {
            console.error('Error getting students requiring attention:', error);
            throw error;
        }
    }

    // Handle onboarding form approval workflow
    static async handleOnboardingApproval(submissionId, facultyId, action) {
        try {
            // Get the onboarding form submission details
            const submissionQuery = `
                SELECT 
                    fs.user_id, fs.form_data,
                    u.first_name, u.last_name, u.email, u.student_id,
                    ft.form_code
                FROM form_submissions fs
                JOIN users u ON fs.user_id = u.id
                JOIN form_types ft ON fs.form_type_id = ft.id
                WHERE fs.id = $1 AND ft.form_code = 'ONBOARDING-001'
            `;
            
            const result = await pool.query(submissionQuery, [submissionId]);
            if (result.rows.length === 0) {
                return { success: false, message: 'Onboarding form not found' };
            }
            
            const submission = result.rows[0];
            
            if (action === 'approved') {
                // Create notification for supervisor to fill consent form
                await pool.query(`
                    INSERT INTO notifications (
                        recipient_id, recipient_type, title, message, notification_type,
                        action_required, action_url, related_form_id
                    ) VALUES ($1, 'faculty', $2, $3, 'approval_request', true, $4, $5)
                `, [
                    facultyId,
                    'Supervisor Consent Form Required',
                    `You have approved the onboarding form for ${submission.first_name} ${submission.last_name} (${submission.student_id}). Please fill the Supervisor Consent Form (PHDEE02-A) to complete the supervision assignment.`,
                    '/forms/PHDEE02-A',
                    submissionId
                ]);
                
                // DO NOT auto-finalize - keep it pending until consent form is submitted
                console.log(`Onboarding form ${submissionId} approved - supervisor must fill consent form`);
                
                return { 
                    success: true, 
                    message: 'Onboarding approved. Supervisor must now fill consent form.',
                    requiresConsentForm: true
                };
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('Error handling onboarding approval:', error);
            return { success: false, message: 'Error processing onboarding approval' };
        }
    }

    // Handle supervisor consent form submission
    static async handleSupervisorConsentSubmission(submissionId, formData) {
        try {
            // Get the consent form details
            const consentQuery = `
                SELECT fs.user_id, fs.form_data
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                WHERE fs.id = $1 AND ft.form_code = 'PHDEE02-A'
            `;
            
            const result = await pool.query(consentQuery, [submissionId]);
            if (result.rows.length === 0) {
                return { success: false, message: 'Consent form not found' };
            }
            
            const consent = result.rows[0];
            const studentId = consent.user_id;
            
            // Get faculty ID from user ID if needed
            let supervisorId = formData.supervisor_id || formData.faculty_id;
            
            if (!supervisorId) {
                // Try to get faculty ID from the user who submitted the consent form
                const facultyQuery = await pool.query(`
                    SELECT f.id as faculty_id
                    FROM users u
                    JOIN faculty f ON u.email = f.email
                    WHERE u.id = $1 AND u.role = 'faculty' AND u.is_active = true
                `, [formData.userId || formData.user_id]);
                
                if (facultyQuery.rows.length > 0) {
                    supervisorId = facultyQuery.rows[0].faculty_id;
                } else {
                    return { success: false, message: 'Faculty ID not found. Please ensure you are logged in as a faculty member.' };
                }
            }
            
            // Assign supervisor to student
            await pool.query(`
                UPDATE users 
                SET primary_supervisor_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [supervisorId, studentId]);
            
            // Update student workflow stage to GEC formation
            await pool.query(`
                UPDATE student_workflow_progress 
                SET 
                    current_stage = 'gec_formation',
                    stage_start_date = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE student_id = $1
            `, [studentId]);
            
            // Finalize any pending onboarding forms for this student
            await pool.query(`
                UPDATE form_submissions fs
                SET 
                    status = 'approved',
                    final_approval_status = 'approved',
                    final_approved_at = CURRENT_TIMESTAMP,
                    last_updated_at = CURRENT_TIMESTAMP
                FROM form_types ft
                WHERE fs.form_type_id = ft.id 
                AND ft.form_code = 'ONBOARDING-001' 
                AND fs.user_id = $1
                AND fs.status = 'submitted'
            `, [studentId]);
            
            // Create notification for student
            await pool.query(`
                INSERT INTO notifications (
                    recipient_id, recipient_type, title, message, notification_type
                ) VALUES ($1, 'student', $2, $3, 'success')
            `, [
                studentId,
                'Supervisor Assigned Successfully',
                'Your supervisor has been assigned and you can now proceed to GEC formation. Please fill the GEC Formation Form when ready.'
            ]);
            
            console.log(`Supervisor consent completed - student ${studentId} assigned to supervisor ${supervisorId}`);
            
            return { 
                success: true, 
                message: 'Supervisor assigned successfully. Student moved to GEC formation stage.',
                studentId,
                supervisorId
            };
            
        } catch (error) {
            console.error('Error handling supervisor consent:', error);
            return { success: false, message: 'Error processing supervisor consent' };
        }
    }

    // Handle GEC formation form submission
    static async handleGECFormationSubmission(submissionId, formData) {
        try {
            // Get GEC members from form data
            const gecMembers = formData.gec_members || [];
            
            if (!gecMembers || gecMembers.length === 0) {
                return { success: false, message: 'No GEC members specified in form' };
            }
            
            // After admin approval, create approval requests for all GEC members
            // This will be called after admin approves the GEC formation form
            
            return { 
                success: true, 
                message: 'GEC formation form submitted. Awaiting admin approval.',
                gecMembers
            };
            
        } catch (error) {
            console.error('Error handling GEC formation:', error);
            return { success: false, message: 'Error processing GEC formation' };
        }
    }
}

module.exports = WorkflowService; 