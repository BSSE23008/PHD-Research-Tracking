const { pool } = require('../config/database');
const WorkflowService = require('../services/WorkflowService');
const NotificationService = require('../services/NotificationService');

class FormController {
    // Get all available form types
    static async getFormTypes(req, res) {
        try {
            const query = `
                SELECT 
                    id, form_code, form_name, description, workflow_stage,
                    requires_dec_approval, requires_supervisor_approval, requires_gec_approval,
                    requires_hod_approval, requires_chairperson_approval,
                    max_submissions_per_user, prerequisite_forms, document_templates
                FROM form_types 
                WHERE is_active = true
                ORDER BY workflow_stage, form_code
            `;

            const result = await pool.query(query);

            res.json({
                success: true,
                data: {
                    formTypes: result.rows
                }
            });

        } catch (error) {
            console.error('Error fetching form types:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch form types',
                error: error.message
            });
        }
    }

    // Get available forms for current user (enhanced version)
    static async getAvailableForms(req, res) {
        try {
            const user_id = req.user.id;

            // Get user's current workflow stage and completed forms
            const userInfo = await pool.query(`
                SELECT 
                    u.current_semester,
                    swp.current_stage,
                    ARRAY_AGG(DISTINCT fs.form_type_id) FILTER (WHERE fs.final_approval_status = 'approved') as completed_forms
                FROM users u
                LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
                LEFT JOIN form_submissions fs ON u.id = fs.user_id
                WHERE u.id = $1
                GROUP BY u.id, u.current_semester, swp.current_stage
            `, [user_id]);

            if (userInfo.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = userInfo.rows[0];
            const currentStage = user.current_stage || 'supervision_consent';
            const completedFormIds = user.completed_forms || [];

            // Get available forms for current stage
            const query = `
                SELECT 
                    ft.*,
                    CASE WHEN $1 = ANY(ft.prerequisite_forms) THEN false ELSE true END as prerequisites_met,
                    CASE WHEN ft.id = ANY($2) THEN true ELSE false END as is_completed,
                    fp.step_number,
                    fp.total_steps
                FROM form_types ft
                LEFT JOIN form_progress fp ON ft.id = fp.form_type_id AND fp.user_id = $3
                WHERE ft.is_active = true 
                AND (ft.workflow_stage = $4 OR ft.workflow_stage = 'course_registration')
                ORDER BY ft.workflow_stage, ft.form_name
            `;

            const result = await pool.query(query, [currentStage, completedFormIds, user_id, currentStage]);

            res.json({
                success: true,
                data: {
                    current_stage: currentStage,
                    current_semester: user.current_semester,
                    available_forms: result.rows
                }
            });

        } catch (error) {
            console.error('Error fetching available forms:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching available forms',
                error: error.message
            });
        }
    }

    // Get form schema/template
    static async getFormSchema(req, res) {
        try {
            const { formCode } = req.params;

            const query = `
                SELECT 
                    form_code, form_name, description, form_schema, 
                    document_templates, prerequisite_forms,
                    requires_dec_approval, requires_supervisor_approval, requires_gec_approval,
                    requires_hod_approval, requires_chairperson_approval
                FROM form_types 
                WHERE form_code = $1 AND is_active = true
            `;

            const result = await pool.query(query, [formCode]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Form type not found'
                });
            }

            const formType = result.rows[0];

            // Check if user can access this form
            const userId = req.user.id;
            const prerequisites = await WorkflowService.checkFormPrerequisites(userId, formCode);

            res.json({
                success: true,
                data: {
                    formType,
                    prerequisitesMet: prerequisites.met,
                    missingPrerequisites: prerequisites.missing
                }
            });

        } catch (error) {
            console.error('Error fetching form schema:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch form schema',
                error: error.message
            });
        }
    }

    // Save form progress (auto-save)
    static async saveProgress(req, res) {
        try {
            const { formCode, formData, stepNumber, totalSteps } = req.body;
            const userId = req.user.id;

            if (!formCode || !formData) {
                return res.status(400).json({
                    success: false,
                    message: 'Form code and form data are required'
                });
            }

            // Get form type ID
            const formTypeQuery = `
                SELECT id FROM form_types WHERE form_code = $1 AND is_active = true
            `;
            const formTypeResult = await pool.query(formTypeQuery, [formCode]);

            if (formTypeResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid form type'
                });
            }

            const formTypeId = formTypeResult.rows[0].id;

            // Upsert progress
            const upsertQuery = `
                INSERT INTO form_progress (user_id, form_type_id, form_data, step_number, total_steps)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, form_type_id) 
                DO UPDATE SET 
                    form_data = EXCLUDED.form_data,
                    step_number = EXCLUDED.step_number,
                    total_steps = EXCLUDED.total_steps,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `;

            const result = await pool.query(upsertQuery, [
                userId, formTypeId, JSON.stringify(formData), stepNumber || 0, totalSteps || 1
            ]);

            res.json({
                success: true,
                message: 'Form progress saved successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error saving form progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save form progress',
                error: error.message
            });
        }
    }

    // Load form progress
    static async loadProgress(req, res) {
        try {
            const { formCode } = req.params;
            const userId = req.user.id;

            const query = `
                SELECT fp.*, ft.form_code
                FROM form_progress fp
                JOIN form_types ft ON fp.form_type_id = ft.id
                WHERE fp.user_id = $1 AND ft.form_code = $2
            `;

            const result = await pool.query(query, [userId, formCode]);

            if (result.rows.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        formData: {},
                        stepNumber: 0,
                        totalSteps: 1
                    }
                });
            }

            const progress = result.rows[0];

            res.json({
                success: true,
                data: {
                    formData: progress.form_data,
                    stepNumber: progress.step_number,
                    totalSteps: progress.total_steps,
                    lastUpdated: progress.updated_at
                }
            });

        } catch (error) {
            console.error('Error loading form progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load form progress',
                error: error.message
            });
        }
    }

    // Submit form
    static async submitForm(req, res) {
        try {
            const { formCode, formData, semester, academicYear } = req.body;
            const userId = req.user.id;

            if (!formCode || !formData) {
                return res.status(400).json({
                    success: false,
                    message: 'Form code and form data are required'
                });
            }

            // Get form type details
            const formTypeQuery = `
                SELECT * FROM form_types WHERE form_code = $1 AND is_active = true
            `;
            const formTypeResult = await pool.query(formTypeQuery, [formCode]);

            if (formTypeResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid form type'
                });
            }

            const formType = formTypeResult.rows[0];

            // Check prerequisites
            const prerequisites = await WorkflowService.checkFormPrerequisites(userId, formCode);
            if (!prerequisites.met) {
                return res.status(400).json({
                    success: false,
                    message: 'Prerequisites not met',
                    data: {
                        missingPrerequisites: prerequisites.missing
                    }
                });
            }

            // Check submission limits
            if (formType.max_submissions_per_user) {
                const countQuery = `
                    SELECT COUNT(*) as submission_count
                    FROM form_submissions 
                    WHERE user_id = $1 AND form_type_id = $2 AND status NOT IN ('rejected', 'draft')
                `;
                const countResult = await pool.query(countQuery, [userId, formType.id]);
                
                if (parseInt(countResult.rows[0].submission_count) >= formType.max_submissions_per_user) {
                    return res.status(400).json({
                        success: false,
                        message: `Maximum ${formType.max_submissions_per_user} submission(s) allowed for this form type`
                    });
                }
            }

            // Create form submission
            const insertQuery = `
                INSERT INTO form_submissions (
                    user_id, form_type_id, form_data, workflow_stage, 
                    semester, academic_year, status
                ) VALUES ($1, $2, $3, $4, $5, $6, 'submitted')
                RETURNING *
            `;

            const currentYear = new Date().getFullYear();
            const defaultAcademicYear = academicYear || `${currentYear}-${currentYear + 1}`;

            const result = await pool.query(insertQuery, [
                userId, 
                formType.id, 
                JSON.stringify(formData), 
                formType.workflow_stage,
                semester || 1,
                defaultAcademicYear
            ]);

            const submission = result.rows[0];

            // Handle special form types
            if (formCode === 'PHDEE02-A') {
                // Supervisor consent form - create supervisor consent record
                // Add the student's user ID to the form data
                const formDataWithUserId = {
                    ...formData,
                    studentUserId: userId  // Add the student's user ID
                };
                await this.handleSupervisorConsentForm(submission.id, formDataWithUserId);
            }

            // Clear saved progress
            await pool.query(
                'DELETE FROM form_progress WHERE user_id = $1 AND form_type_id = $2',
                [userId, formType.id]
            );

            // Send notifications to approvers
            await this.sendApprovalNotifications(submission, formType);

            res.json({
                success: true,
                message: 'Form submitted successfully',
                data: {
                    submissionId: submission.id,
                    status: submission.status,
                    submittedAt: submission.submitted_at
                }
            });

        } catch (error) {
            console.error('Error submitting form:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit form',
                error: error.message
            });
        }
    }

    // Handle supervisor consent form submission
    static async handleSupervisorConsentForm(submissionId, formData) {
        try {
            // Get the submission details to get the student's user ID
            const submissionQuery = `
                SELECT fs.user_id, u.first_name, u.last_name, u.email, u.student_id
                FROM form_submissions fs
                JOIN users u ON fs.user_id = u.id
                WHERE fs.id = $1
            `;
            const submissionResult = await pool.query(submissionQuery, [submissionId]);
            
            if (submissionResult.rows.length === 0) {
                console.error('Form submission not found for ID:', submissionId);
                return;
            }
            
            const student = submissionResult.rows[0];
            const studentUserId = student.user_id;
            
            // Create a basic consent form record that can be filled by supervisor later
            const insertQuery = `
                INSERT INTO supervisor_consent_forms (
                    form_submission_id, supervisor_id, student_user_id,
                    supervisor_name, supervisor_designation, supervisor_department,
                    area_of_research, contact_no, email, research_topic,
                    hec_approved_supervisor_ref, hec_approval_date,
                    num_existing_phd_students, num_existing_ms_students,
                    supervision_type, supervisor_consent, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                ON CONFLICT (form_submission_id) DO UPDATE SET
                    supervisor_id = EXCLUDED.supervisor_id,
                    supervisor_name = EXCLUDED.supervisor_name,
                    supervisor_designation = EXCLUDED.supervisor_designation,
                    supervisor_department = EXCLUDED.supervisor_department,
                    area_of_research = EXCLUDED.area_of_research,
                    contact_no = EXCLUDED.contact_no,
                    email = EXCLUDED.email,
                    research_topic = EXCLUDED.research_topic,
                    hec_approved_supervisor_ref = EXCLUDED.hec_approved_supervisor_ref,
                    hec_approval_date = EXCLUDED.hec_approval_date,
                    num_existing_phd_students = EXCLUDED.num_existing_phd_students,
                    num_existing_ms_students = EXCLUDED.num_existing_ms_students,
                    supervision_type = EXCLUDED.supervision_type,
                    supervisor_consent = EXCLUDED.supervisor_consent,
                    status = EXCLUDED.status
            `;

            await pool.query(insertQuery, [
                submissionId,
                formData.supervisorId || null, // Will be null initially when student submits
                studentUserId,
                formData.supervisorName || '',
                formData.supervisorDesignation || '',
                formData.supervisorDepartment || '',
                formData.areaOfResearch || formData.projectDescription || '',
                formData.contactNo || '',
                formData.email || '',
                formData.researchTopic || formData.projectTitle || '',
                formData.hecApprovedSupervisorRef || '',
                formData.hecApprovalDate || null,
                formData.numExistingPhdStudents || 0,
                formData.numExistingMsStudents || 0,
                formData.supervisionType || 'main_supervisor',
                formData.supervisorConsent || false,
                'pending' // Initial status
            ]);

            console.log(`Created supervisor consent form record for submission ${submissionId}, student ${student.first_name} ${student.last_name}`);

        } catch (error) {
            console.error('Error handling supervisor consent form:', error);
            // Don't throw error, as main submission should still succeed
        }
    }

    // Send approval notifications
    static async sendApprovalNotifications(submission, formType) {
        try {
            const notifications = [];

            // DEC approval notifications
            if (formType.requires_dec_approval) {
                const decQuery = `
                    SELECT f.id, u.id as user_id FROM faculty f
                    LEFT JOIN users u ON f.email = u.email AND u.role = 'faculty'
                    WHERE f.id IN (
                        SELECT faculty_id FROM faculty_roles 
                        WHERE role = 'dec_member' AND is_active = true
                    )
                `;
                const decResult = await pool.query(decQuery);
                
                for (const dec of decResult.rows) {
                    if (dec.user_id) {
                        notifications.push(
                            NotificationService.createNotification({
                                userId: dec.user_id,
                                title: 'New Form Submission Requires DEC Approval',
                                message: `${formType.form_name} (${formType.form_code}) submitted and requires DEC approval`,
                                notificationType: 'approval_request',
                                relatedFormId: submission.id,
                                actionRequired: true,
                                actionUrl: `/faculty/approvals/${submission.id}`
                            })
                        );
                    }
                }
            }

            if (formType.requires_supervisor_approval) {
                // Get student's supervisor (if assigned)
                const supervisorQuery = `
                    SELECT supervisor_id 
                    FROM supervisor_consent_forms scf
                    JOIN form_submissions fs ON scf.form_submission_id = fs.id
                    WHERE fs.user_id = $1 AND fs.status = 'approved'
                    LIMIT 1
                `;
                const supervisorResult = await pool.query(supervisorQuery, [submission.user_id]);
                
                if (supervisorResult.rows.length > 0) {
                    notifications.push(
                        NotificationService.createNotification({
                            userId: supervisorResult.rows[0].supervisor_id,
                            title: 'Student Form Requires Your Approval',
                            message: `${formType.form_name} (${formType.form_code}) submitted by your student requires approval`,
                            notificationType: 'info',
                            relatedFormId: submission.id,
                            actionRequired: true,
                            actionUrl: `/supervisor/approvals/${submission.id}`
                        })
                    );
                }
            }

            await Promise.all(notifications);

        } catch (error) {
            console.error('Error sending approval notifications:', error);
            // Don't throw error, as main submission should still succeed
        }
    }

    // Get user's form submissions
    static async getSubmissions(req, res) {
        try {
            const userId = req.user.id;
            const { status, formCode, page = 1, limit = 20, supervisor_id } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = '';
            let queryParams = [];
            let paramCount = 0;

            // Handle supervisor requests
            if (supervisor_id && req.user.role === 'supervisor') {
                paramCount++;
                whereClause = `WHERE scf.supervisor_id = $${paramCount}`;
                queryParams.push(supervisor_id);
            } else {
                // Regular user - show their own submissions
                paramCount++;
                whereClause = 'WHERE fs.user_id = $1';
                queryParams.push(userId);
            }

            if (status) {
                paramCount++;
                whereClause += ` AND fs.status = $${paramCount}`;
                queryParams.push(status);
            }

            if (formCode) {
                paramCount++;
                whereClause += ` AND ft.form_code = $${paramCount}`;
                queryParams.push(formCode);
            }

            let submissionsQuery = '';
            let countQuery = '';

            if (supervisor_id && req.user.role === 'supervisor') {
                // Supervisor view - show all forms that need supervisor attention
                // For PHDEE02-A (consent forms), show all pending forms that any supervisor can fill
                // For other forms, show only forms from students under this supervisor's supervision
                submissionsQuery = `
                    SELECT 
                        fs.*,
                        ft.form_code,
                        ft.form_name,
                        ft.workflow_stage,
                        ft.requires_supervisor_approval,
                        ft.requires_admin_approval,
                        ft.requires_gec_approval,
                        u.first_name || ' ' || u.last_name as student_name,
                        u.email as student_email,
                        u.student_id
                    FROM form_submissions fs
                    JOIN form_types ft ON fs.form_type_id = ft.id
                    JOIN users u ON fs.user_id = u.id
                    WHERE (
                        -- Show all PHDEE02-A forms that need supervisor approval (any supervisor can fill these)
                        (ft.form_code = 'PHDEE02-A' AND fs.supervisor_approval_status = 'pending')
                        OR
                        -- Show other forms from students under this supervisor's supervision
                        (ft.form_code != 'PHDEE02-A' AND EXISTS (
                            SELECT 1 FROM supervisor_consent_forms scf
                            WHERE scf.supervisor_id = $1 
                            AND scf.student_user_id = u.id
                            AND scf.status = 'approved'
                        ))
                    )
                    ${status ? `AND fs.status = '${status}'` : ''}
                    ${formCode ? `AND ft.form_code = '${formCode}'` : ''}
                    ORDER BY fs.submitted_at DESC
                    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
                `;

                countQuery = `
                    SELECT COUNT(*) as total
                    FROM form_submissions fs
                    JOIN form_types ft ON fs.form_type_id = ft.id
                    JOIN users u ON fs.user_id = u.id
                    WHERE (
                        -- Count all PHDEE02-A forms that need supervisor approval
                        (ft.form_code = 'PHDEE02-A' AND fs.supervisor_approval_status = 'pending')
                        OR
                        -- Count other forms from students under this supervisor's supervision
                        (ft.form_code != 'PHDEE02-A' AND EXISTS (
                            SELECT 1 FROM supervisor_consent_forms scf
                            WHERE scf.supervisor_id = $1 
                            AND scf.student_user_id = u.id
                            AND scf.status = 'approved'
                        ))
                    )
                    ${status ? `AND fs.status = '${status}'` : ''}
                    ${formCode ? `AND ft.form_code = '${formCode}'` : ''}
                `;
            } else {
                // Student/Regular user view - get their own submissions
                submissionsQuery = `
                    SELECT 
                        fs.*,
                        ft.form_code,
                        ft.form_name,
                        ft.workflow_stage,
                        ft.requires_supervisor_approval,
                        ft.requires_admin_approval,
                        ft.requires_gec_approval
                    FROM form_submissions fs
                    JOIN form_types ft ON fs.form_type_id = ft.id
                    ${whereClause}
                    ORDER BY fs.submitted_at DESC
                    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
                `;

                countQuery = `
                    SELECT COUNT(*) as total
                    FROM form_submissions fs
                    JOIN form_types ft ON fs.form_type_id = ft.id
                    ${whereClause}
                `;
            }

            queryParams.push(limit, offset);

            const [submissions, count] = await Promise.all([
                pool.query(submissionsQuery, queryParams),
                pool.query(countQuery, queryParams.slice(0, -2))
            ]);

            res.json({
                success: true,
                data: {
                    submissions: submissions.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: parseInt(count.rows[0].total),
                        pages: Math.ceil(count.rows[0].total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching submissions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch submissions',
                error: error.message
            });
        }
    }

    // Get submission by ID
    static async getSubmissionById(req, res) {
        try {
            const { submissionId } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;

            let whereClause = 'WHERE fs.id = $1';
            let queryParams = [submissionId];

            // Restrict access based on role
            if (userRole === 'student') {
                whereClause += ' AND fs.user_id = $2';
                queryParams.push(userId);
            }

            const query = `
                SELECT 
                    fs.*,
                    ft.form_code,
                    ft.form_name,
                    ft.description,
                    ft.workflow_stage,
                    ft.requires_supervisor_approval,
                    ft.requires_admin_approval,
                    ft.requires_gec_approval,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.email as student_email,
                    u.student_id
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                ${whereClause}
            `;

            const result = await pool.query(query, queryParams);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Submission not found or access denied'
                });
            }

            const submission = result.rows[0];

            // Get attachments if any
            const attachmentsQuery = `
                SELECT id, file_name, file_type, upload_type, uploaded_at, is_verified
                FROM form_attachments 
                WHERE form_submission_id = $1
                ORDER BY uploaded_at DESC
            `;

            const attachments = await pool.query(attachmentsQuery, [submissionId]);
            submission.attachments = attachments.rows;

            res.json({
                success: true,
                data: submission
            });

        } catch (error) {
            console.error('Error fetching submission:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch submission',
                error: error.message
            });
        }
    }

    // Get form analytics (for admin)
    static async getFormAnalytics(req, res) {
        try {
            // Form submission statistics
            const statsQuery = `
                SELECT 
                    ft.form_code,
                    ft.form_name,
                    ft.workflow_stage,
                    COUNT(fs.id) as total_submissions,
                    COUNT(CASE WHEN fs.status = 'submitted' THEN 1 END) as pending_submissions,
                    COUNT(CASE WHEN fs.status = 'approved' THEN 1 END) as approved_submissions,
                    COUNT(CASE WHEN fs.status = 'rejected' THEN 1 END) as rejected_submissions,
                    AVG(EXTRACT(EPOCH FROM (fs.approved_at - fs.submitted_at))/86400) as avg_approval_days
                FROM form_types ft
                LEFT JOIN form_submissions fs ON ft.id = fs.form_type_id
                GROUP BY ft.id, ft.form_code, ft.form_name, ft.workflow_stage
                ORDER BY total_submissions DESC
            `;

            // Monthly submission trends
            const trendsQuery = `
                SELECT 
                    DATE_TRUNC('month', submitted_at) as month,
                    COUNT(*) as submission_count,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count
                FROM form_submissions
                WHERE submitted_at >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', submitted_at)
                ORDER BY month
            `;

            const [stats, trends] = await Promise.all([
                pool.query(statsQuery),
                pool.query(trendsQuery)
            ]);

            res.json({
                success: true,
                data: {
                    formStatistics: stats.rows,
                    submissionTrends: trends.rows
                }
            });

        } catch (error) {
            console.error('Error fetching form analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch form analytics',
                error: error.message
            });
        }
    }

    // Upload form attachment
    static async uploadAttachment(req, res) {
        try {
            const { submissionId } = req.params;
            const { uploadType, fileType } = req.body;
            const userId = req.user.id;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Verify submission belongs to user (for students)
            if (req.user.role === 'student') {
                const verifyQuery = `
                    SELECT id FROM form_submissions 
                    WHERE id = $1 AND user_id = $2
                `;
                const verifyResult = await pool.query(verifyQuery, [submissionId, userId]);
                
                if (verifyResult.rows.length === 0) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied'
                    });
                }
            }

            const insertQuery = `
                INSERT INTO form_attachments (
                    form_submission_id, file_name, file_path, file_type, file_size,
                    upload_type, uploaded_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const result = await pool.query(insertQuery, [
                submissionId,
                req.file.originalname,
                req.file.path,
                fileType || req.file.mimetype,
                req.file.size,
                uploadType || 'supporting_document',
                userId
            ]);

            res.json({
                success: true,
                message: 'File uploaded successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error uploading attachment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload attachment',
                error: error.message
            });
        }
    }

    // Create notifications for form approvers
    static async createApprovalNotifications(submissionId, formType) {
        try {
            const formSubmission = await pool.query(`
                SELECT fs.*, u.first_name || ' ' || u.last_name as student_name, u.student_id
                FROM form_submissions fs
                JOIN users u ON fs.user_id = u.id
                WHERE fs.id = $1
            `, [submissionId]);

            if (formSubmission.rows.length === 0) return;

            const submission = formSubmission.rows[0];
            
            // Create notification for DEC members if required
            if (formType.requires_dec_approval) {
                const decMembers = await pool.query(`
                    SELECT DISTINCT f.id 
                    FROM faculty f
                    JOIN faculty_roles fr ON f.id = fr.faculty_id
                    WHERE fr.role = 'dec_member' AND fr.is_active = true
                `);

                for (const member of decMembers.rows) {
                    await pool.query(`
                        INSERT INTO notifications (recipient_id, recipient_type, title, message, notification_type, related_form_id, action_required, action_url)
                        VALUES ($1, 'faculty', $2, $3, 'approval_request', $4, true, $5)
                    `, [
                        member.id,
                        'New Form Requires DEC Approval',
                        `Student ${submission.first_name} ${submission.last_name} (${submission.student_id}) has submitted ${formType.form_name} requiring your approval.`,
                        submissionId,
                        `/faculty/approvals/${submissionId}`
                    ]);
                }
            }

            // Create notification for supervisor if required
            if (formType.requires_supervisor_approval) {
                const studentInfo = await pool.query(`
                    SELECT primary_supervisor_id, co_supervisor_id 
                    FROM users WHERE id = $1
                `, [submission.user_id]);

                if (studentInfo.rows[0].primary_supervisor_id) {
                    await pool.query(`
                        INSERT INTO notifications (recipient_id, recipient_type, title, message, notification_type, related_form_id, action_required, action_url)
                        VALUES ($1, 'faculty', $2, $3, 'approval_request', $4, true, $5)
                    `, [
                        studentInfo.rows[0].primary_supervisor_id,
                        'New Form Requires Your Approval',
                        `Your student ${submission.first_name} ${submission.last_name} (${submission.student_id}) has submitted ${formType.form_name} requiring your approval.`,
                        submissionId,
                        `/faculty/approvals/${submissionId}`
                    ]);
                }
            }

        } catch (error) {
            console.error('Error creating approval notifications:', error);
        }
    }

    // Get form submission with approval status
    static async getFormSubmission(req, res) {
        try {
            const { id } = req.params;
            
            const query = `
                SELECT 
                    fs.*,
                    ft.form_name,
                    ft.form_code,
                    ft.requires_dec_approval,
                    ft.requires_supervisor_approval,
                    ft.requires_gec_approval,
                    ft.requires_hod_approval,
                    ft.requires_chairperson_approval,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    d.dept_name as department,
                    
                    -- Approver information
                    f1.first_name || ' ' || f1.last_name as dec_approver,
                    f2.first_name || ' ' || f2.last_name as supervisor_approver,
                    f3.first_name || ' ' || f3.last_name as gec_approver,
                    f4.first_name || ' ' || f4.last_name as hod_approver,
                    f5.first_name || ' ' || f5.last_name as chairperson_approver
                    
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN faculty f1 ON fs.dec_approved_by = f1.id
                LEFT JOIN faculty f2 ON fs.supervisor_approved_by = f2.id
                LEFT JOIN faculty f3 ON fs.gec_approved_by = f3.id
                LEFT JOIN faculty f4 ON fs.hod_approved_by = f4.id
                LEFT JOIN faculty f5 ON fs.chairperson_approved_by = f5.id
                WHERE fs.id = $1
            `;

            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Form submission not found'
                });
            }

            const submission = result.rows[0];

            // Calculate overall approval status
            const approvalStages = [
                { name: 'DEC', required: submission.requires_dec_approval, status: submission.dec_approval_status, approver: submission.dec_approver, date: submission.dec_approved_at, comments: submission.dec_comments },
                { name: 'Supervisor', required: submission.requires_supervisor_approval, status: submission.supervisor_approval_status, approver: submission.supervisor_approver, date: submission.supervisor_approved_at, comments: submission.supervisor_comments },
                { name: 'GEC', required: submission.requires_gec_approval, status: submission.gec_approval_status, approver: submission.gec_approver, date: submission.gec_approved_at, comments: submission.gec_comments },
                { name: 'HOD', required: submission.requires_hod_approval, status: submission.hod_approval_status, approver: submission.hod_approver, date: submission.hod_approved_at, comments: submission.hod_comments },
                { name: 'Chairperson', required: submission.requires_chairperson_approval, status: submission.chairperson_approval_status, approver: submission.chairperson_approver, date: submission.chairperson_approved_at, comments: submission.chairperson_comments }
            ];

            const requiredStages = approvalStages.filter(stage => stage.required);
            const approvedStages = requiredStages.filter(stage => stage.status === 'approved');
            const rejectedStages = requiredStages.filter(stage => stage.status === 'rejected');

            let overallStatus = 'pending';
            if (rejectedStages.length > 0) {
                overallStatus = 'rejected';
            } else if (approvedStages.length === requiredStages.length) {
                overallStatus = 'approved';
            } else {
                overallStatus = 'under_review';
            }

            res.json({
                success: true,
                data: {
                    ...submission,
                    approval_stages: approvalStages,
                    overall_status: overallStatus,
                    progress: {
                        completed: approvedStages.length,
                        total: requiredStages.length,
                        percentage: Math.round((approvedStages.length / requiredStages.length) * 100)
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching form submission:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching form submission',
                error: error.message
            });
        }
    }

    // Get user's form submissions with approval status
    static async getUserSubmissions(req, res) {
        try {
            const user_id = req.user.id;
            const { page = 1, limit = 10, status, form_type } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE fs.user_id = $1';
            const params = [user_id];
            let paramCount = 1;

            if (status) {
                paramCount++;
                whereClause += ` AND fs.status = $${paramCount}`;
                params.push(status);
            }

            if (form_type) {
                paramCount++;
                whereClause += ` AND ft.form_code = $${paramCount}`;
                params.push(form_type);
            }

            const query = `
                SELECT 
                    fs.*,
                    ft.form_name,
                    ft.form_code,
                    ft.requires_dec_approval,
                    ft.requires_supervisor_approval,
                    ft.requires_gec_approval,
                    ft.requires_hod_approval,
                    ft.requires_chairperson_approval,
                    
                    CASE 
                        WHEN NOT ft.requires_dec_approval OR fs.dec_approval_status = 'approved' THEN 1 ELSE 0 END +
                        CASE WHEN NOT ft.requires_supervisor_approval OR fs.supervisor_approval_status = 'approved' THEN 1 ELSE 0 END +
                        CASE WHEN NOT ft.requires_gec_approval OR fs.gec_approval_status = 'approved' THEN 1 ELSE 0 END +
                        CASE WHEN NOT ft.requires_hod_approval OR fs.hod_approval_status = 'approved' THEN 1 ELSE 0 END +
                        CASE WHEN NOT ft.requires_chairperson_approval OR fs.chairperson_approval_status = 'approved' THEN 1 ELSE 0 END 
                    as approvals_completed,
                    
                    CASE WHEN ft.requires_dec_approval THEN 1 ELSE 0 END +
                    CASE WHEN ft.requires_supervisor_approval THEN 1 ELSE 0 END +
                    CASE WHEN ft.requires_gec_approval THEN 1 ELSE 0 END +
                    CASE WHEN ft.requires_hod_approval THEN 1 ELSE 0 END +
                    CASE WHEN ft.requires_chairperson_approval THEN 1 ELSE 0 END 
                    as total_approvals_required

                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                ${whereClause}
                ORDER BY fs.submitted_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            params.push(limit, offset);
            const result = await pool.query(query, params);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) 
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                ${whereClause}
            `;
            const countResult = await pool.query(countQuery, params.slice(0, -2));

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].count),
                    pages: Math.ceil(countResult.rows[0].count / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching user submissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching submissions',
                error: error.message
            });
        }
    }

    // Save form progress (auto-save functionality)
    static async saveFormProgress(req, res) {
        try {
            const { form_type_id, form_data, step_number = 0, total_steps = 1 } = req.body;
            const user_id = req.user.id;

            // Get auto-populate data
            const autoPopulateResult = await pool.query(
                'SELECT get_auto_populate_data($1, $2) as auto_data',
                [user_id, form_type_id]
            );
            
            const autoData = autoPopulateResult.rows[0].auto_data || {};

            const result = await pool.query(`
                INSERT INTO form_progress (user_id, form_type_id, form_data, step_number, total_steps, auto_populated_fields)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id, form_type_id) 
                DO UPDATE SET 
                    form_data = EXCLUDED.form_data,
                    step_number = EXCLUDED.step_number,
                    total_steps = EXCLUDED.total_steps,
                    auto_populated_fields = EXCLUDED.auto_populated_fields,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `, [user_id, form_type_id, JSON.stringify(form_data), step_number, total_steps, JSON.stringify(autoData)]);

            res.json({
                success: true,
                message: 'Form progress saved successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error saving form progress:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving form progress',
                error: error.message
            });
        }
    }

    // Get form progress
    static async getFormProgress(req, res) {
        try {
            const { form_type_id } = req.params;
            const user_id = req.user.id;

            const result = await pool.query(`
                SELECT fp.*, ft.form_name
                FROM form_progress fp
                JOIN form_types ft ON fp.form_type_id = ft.id
                WHERE fp.user_id = $1 AND fp.form_type_id = $2
            `, [user_id, form_type_id]);

            if (result.rows.length === 0) {
                // Get auto-populate data for new form
                const autoPopulateResult = await pool.query(
                    'SELECT get_auto_populate_data($1, $2) as auto_data',
                    [user_id, form_type_id]
                );

                return res.json({
                    success: true,
                    data: {
                        form_data: {},
                        auto_populated_fields: autoPopulateResult.rows[0].auto_data || {},
                        step_number: 0,
                        total_steps: 1
                    }
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error fetching form progress:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching form progress',
                error: error.message
            });
        }
    }



    // Get form approval history
    static async getFormApprovalHistory(req, res) {
        try {
            const { form_submission_id } = req.params;

            const query = `
                SELECT 
                    fah.*,
                    f.first_name || ' ' || f.last_name as approver_name,
                    f.designation
                FROM form_approval_history fah
                LEFT JOIN faculty f ON fah.approved_by = f.id
                WHERE fah.form_submission_id = $1
                ORDER BY fah.action_date ASC
            `;

            const result = await pool.query(query, [form_submission_id]);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching approval history:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching approval history',
                error: error.message
            });
        }
    }
}

module.exports = FormController; 