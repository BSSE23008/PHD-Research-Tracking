const { pool } = require('../config/database');
const WorkflowService = require('../services/WorkflowService');

class FacultyController {
    // Get students supervised by this faculty member
    static async getMyStudents(req, res) {
        try {
            
            const userId = req.user.id;
            
            // Get faculty ID from user ID
            const facultyQuery = await pool.query(`
                SELECT f.id as faculty_id
                FROM users u
                JOIN faculty f ON u.email = f.email
                WHERE u.id = $1 AND u.role = 'faculty' AND u.is_active = true
            `, [userId]);

            if (facultyQuery.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Faculty member not found'
                });
            }

            const facultyId = facultyQuery.rows[0].faculty_id;

            // Get students supervised by this faculty member
            const studentsQuery = `
                SELECT 
                    u.*,
                    d.dept_name,
                    d.dept_code,
                    f1.first_name || ' ' || f1.last_name as primary_supervisor_name,
                    f1.email as primary_supervisor_email,
                    f2.first_name || ' ' || f2.last_name as co_supervisor_name,
                    f2.email as co_supervisor_email,
                    swp.current_stage,
                    swp.total_forms_submitted,
                    swp.total_forms_approved,
                    swp.has_pending_actions,
                    swp.current_gpa,
                    CASE 
                        WHEN u.primary_supervisor_id = $1 THEN 'Primary Supervisor'
                        WHEN u.co_supervisor_id = $1 THEN 'Co-Supervisor'
                        ELSE 'Unknown'
                    END as supervision_type
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
                LEFT JOIN faculty f2 ON u.co_supervisor_id = f2.id
                LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
                WHERE u.role = 'student' 
                AND (u.primary_supervisor_id = $1 OR u.co_supervisor_id = $1)
                AND u.is_active = true
                ORDER BY u.created_at DESC
            `;

            const studentsResult = await pool.query(studentsQuery, [facultyId]);

            res.json({
                success: true,
                data: studentsResult.rows,
                faculty_id: facultyId,
                count: studentsResult.rows.length
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching supervised students',
                error: error.message
            });
        }
    }

    // Get faculty dashboard data
    static async getFacultyDashboard(req, res) {
        try {
            const userId = req.user.id;

            // Get faculty information
            const facultyQuery = await pool.query(`
                SELECT 
                    f.*,
                    u.id as user_id,
                    d.dept_name,
                    d.dept_code
                FROM users u
                JOIN faculty f ON u.email = f.email
                LEFT JOIN departments d ON f.department_id = d.id
                WHERE u.id = $1 AND u.role = 'faculty' AND u.is_active = true
            `, [userId]);

            if (facultyQuery.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Faculty member not found'
                });
            }

            const faculty = facultyQuery.rows[0];

            // Get supervised students count
            const studentsCount = await pool.query(`
                SELECT COUNT(*) as total_students
                FROM users u
                WHERE u.role = 'student' 
                AND (u.primary_supervisor_id = $1 OR u.co_supervisor_id = $1)
                AND u.is_active = true
            `, [faculty.id]);

            // Get pending approvals count
            const pendingCount = await pool.query(`
                SELECT COUNT(*) as pending_approvals
                FROM form_submissions fs
                JOIN users u ON fs.user_id = u.id
                WHERE (u.primary_supervisor_id = $1 OR u.co_supervisor_id = $1)
                AND fs.supervisor_approval_status = 'pending'
            `, [faculty.id]);

            res.json({
                success: true,
                data: {
                    faculty_info: faculty,
                    stats: {
                        total_students: parseInt(studentsCount.rows[0].total_students),
                        pending_approvals: parseInt(pendingCount.rows[0].pending_approvals)
                    }
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching faculty dashboard',
                error: error.message
            });
        }
    }

    // DPRC Dashboard functionality
    
    // Get DPRC dashboard data for faculty member
    static async getDPRCDashboard(req, res) {
        try {
            const userId = req.user.id;
            
            // Check if faculty is DPRC member
            const dprcMemberCheck = await pool.query(`
                SELECT 
                    dma.id as assignment_id,
                    dma.role_in_committee,
                    dp.id as dprc_id,
                    dp.committee_name,
                    d.id as department_id,
                    d.dept_name,
                    d.dept_code
                FROM users u
                JOIN faculty f ON u.email = f.email
                JOIN dprc_member_assignments dma ON f.id = dma.faculty_id
                JOIN dprc_committees dp ON dma.dprc_committee_id = dp.id
                JOIN departments d ON dp.department_id = d.id
                WHERE u.id = $1 AND u.role = 'faculty' AND dma.is_active = true AND dp.is_active = true
            `, [userId]);

            if (dprcMemberCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You are not a DPRC member.'
                });
            }

            const dprcInfo = dprcMemberCheck.rows[0];

            // Get faculty ID for this user
            const facultyIdQuery = await pool.query(`
                SELECT f.id as faculty_id
                FROM users u
                JOIN faculty f ON u.email = f.email
                WHERE u.id = $1 AND u.role = 'faculty' AND u.is_active = true
            `, [userId]);

            const currentFacultyId = facultyIdQuery.rows[0]?.faculty_id;

            // Get pending forms requiring DPRC approval that this faculty member hasn't voted on
            const pendingForms = await pool.query(`
                SELECT 
                    fs.id,
                    fs.submitted_at,
                    fs.semester,
                    fs.academic_year,
                    ft.form_name,
                    ft.form_code,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    u.email as student_email,
                    u.research_area,
                    d.dept_name,
                    das.overall_status,
                    das.approved_by,
                    das.rejected_by,
                    das.pending_members,
                    das.approved_count,
                    das.rejected_count,
                    das.total_members,
                    CASE 
                        WHEN das.overall_status = 'pending' THEN 'awaiting_your_vote'
                        ELSE 'other'
                    END as approval_stage
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN dprc_form_approval_summary das ON fs.id = das.form_submission_id
                WHERE u.department_id = $1 
                AND ft.requires_dprc_approval = true
                AND fs.dprc_approval_status = 'pending'
                AND NOT EXISTS (
                    SELECT 1 FROM dprc_member_approvals dma 
                    WHERE dma.form_submission_id = fs.id 
                    AND dma.faculty_id = $2
                )
                ORDER BY fs.submitted_at ASC
            `, [dprcInfo.department_id, currentFacultyId]);

            // Get recently processed forms by this DPRC with individual member tracking
            const recentForms = await pool.query(`
                SELECT 
                    fs.id,
                    fs.submitted_at,
                    fs.dprc_approved_at,
                    fs.dprc_approval_status,
                    fs.status as form_status,
                    ft.form_name,
                    ft.form_code,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    das.overall_status,
                    das.approved_by,
                    das.rejected_by,
                    das.approved_count,
                    das.rejected_count,
                    das.total_members,
                    das.last_decision_date,
                    -- Check if current faculty voted on this form
                    CASE WHEN dma_current.id IS NOT NULL THEN dma_current.approval_status ELSE NULL END as my_decision,
                    CASE WHEN dma_current.id IS NOT NULL THEN dma_current.comments ELSE NULL END as my_comments,
                    CASE WHEN dma_current.id IS NOT NULL THEN dma_current.decision_date ELSE NULL END as my_decision_date
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                LEFT JOIN dprc_form_approval_summary das ON fs.id = das.form_submission_id
                LEFT JOIN dprc_member_approvals dma_current ON fs.id = dma_current.form_submission_id AND dma_current.faculty_id = $2
                WHERE u.department_id = $1 
                AND ft.requires_dprc_approval = true
                AND (fs.dprc_approval_status IN ('approved', 'rejected') OR fs.status IN ('approved_by_dprc', 'awaiting_supervisor_consent', 'supervisor_approved', 'gec_ready'))
                ORDER BY COALESCE(das.last_decision_date, fs.last_updated_at, fs.submitted_at) DESC
                LIMIT 20
            `, [dprcInfo.department_id, currentFacultyId]);

            res.json({
                success: true,
                data: {
                    dprc_info: dprcInfo,
                    pending_forms: pendingForms.rows,
                    recent_forms: recentForms.rows,
                    department_info: {
                        id: dprcInfo.department_id,
                        dept_name: dprcInfo.dept_name,
                        dept_code: dprcInfo.dept_code
                    }
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error loading DPRC dashboard',
                error: error.message
            });
        }
    }

    // Process DPRC approval/rejection with individual member tracking
    static async processDPRCApproval(req, res) {
        try {
            const { submissionId } = req.params;
            const { action, comments } = req.body; // action: 'approve' or 'reject'
            const userId = req.user.id;

            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Must be "approve" or "reject"'
                });
            }

            // Get faculty ID from user ID
            const facultyQuery = await pool.query(`
                SELECT f.id as faculty_id
                FROM users u
                JOIN faculty f ON u.email = f.email
                WHERE u.id = $1 AND u.role = 'faculty' AND u.is_active = true
            `, [userId]);

            if (facultyQuery.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Faculty member not found'
                });
            }

            const facultyId = facultyQuery.rows[0].faculty_id;
            const status = action === 'approve' ? 'approved' : 'rejected';

            // Use the new individual tracking function to record the vote
            const voteResult = await pool.query(`
                SELECT record_dprc_member_vote($1, $2, $3, $4, $5, $6) as result
            `, [
                facultyId, 
                submissionId, 
                status, 
                comments,
                req.ip || null,
                req.get('User-Agent') || null
            ]);

            const result = voteResult.rows[0].result;

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }

            // Get updated form status with individual member tracking
            const statusQuery = await pool.query(`
                SELECT 
                    fs.*,
                    das.overall_status,
                    das.approved_by,
                    das.rejected_by,
                    das.pending_members,
                    das.approved_count,
                    das.rejected_count,
                    das.total_members
                FROM form_submissions fs
                LEFT JOIN dprc_form_approval_summary das ON fs.id = das.form_submission_id
                WHERE fs.id = $1
            `, [submissionId]);

            const formData = statusQuery.rows[0];

            // Check form type and handle DPRC approval completion
            const formTypeQuery = `
                SELECT ft.form_code, ft.requires_dec_approval, ft.requires_dprc_approval, ft.requires_supervisor_approval, 
                       ft.requires_gec_approval, ft.requires_hod_approval, ft.requires_chairperson_approval
                FROM form_types ft WHERE ft.id = $1
            `;
            const formTypeResult = await pool.query(formTypeQuery, [formData.form_type_id]);
            
            if (formTypeResult.rows.length > 0) {
                const formType = formTypeResult.rows[0];
                
                // Handle DPRC approval completion for all forms
                if (formData.dprc_approval_status === 'approved') {
                    console.log(`Form ${formType.form_code} (ID: ${submissionId}) approved by all DPRC members`);
                    
                    // Update form status to approved_by_dprc
                    await pool.query(`
                        UPDATE form_submissions 
                        SET status = 'approved_by_dprc', last_updated_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                    `, [submissionId]);
                    
                    // Special handling for onboarding forms and supervisor assignment requests
                    if (formType.form_code === 'ONBOARDING-001' || formType.form_code === 'PHDEE02-A') {
                        console.log(`${formType.form_code} form ${submissionId} approved by DPRC - waiting for supervisor consent`);
                        
                        // Get the supervisor information from the form data
                        const formDataObj = formData.form_data ? JSON.parse(formData.form_data) : {};
                        const supervisorEmail = formDataObj.supervisorEmail || formDataObj.supervisor_email;
                        
                        if (supervisorEmail) {
                            // Find the supervisor by email
                            const supervisorQuery = await pool.query(`
                                SELECT f.id as faculty_id, u.id as user_id, u.first_name, u.last_name
                            FROM faculty f
                            JOIN users u ON f.email = u.email
                            WHERE f.email = $1 AND u.role = 'faculty' AND u.is_active = true
                        `, [supervisorEmail]);
                        
                        if (supervisorQuery.rows.length > 0) {
                            const supervisor = supervisorQuery.rows[0];
                            
                            // Get student information
                            const studentQuery = await pool.query(`
                                SELECT u.first_name, u.last_name, u.student_id
                                FROM users u
                                JOIN form_submissions fs ON u.id = fs.user_id
                                WHERE fs.id = $1
                            `, [submissionId]);
                            
                            if (studentQuery.rows.length > 0) {
                                const student = studentQuery.rows[0];
                                
                                // Create notification for supervisor to fill consent form
                                await pool.query(`
                                    INSERT INTO notifications (
                                        recipient_id, recipient_type, title, message, notification_type,
                                        action_required, action_url, related_form_id
                                    ) VALUES ($1, 'faculty', $2, $3, 'approval_request', true, $4, $5)
                                `, [
                                    supervisor.user_id,
                                    'Supervisor Consent Form Required',
                                    `DPRC has approved the ${formType.form_code === 'ONBOARDING-001' ? 'onboarding form' : 'supervisor assignment request'} for ${student.first_name} ${student.last_name} (${student.student_id}). Please fill the Supervisor Consent Form to complete the supervision assignment.`,
                                    '/forms/SupervisorConsent',
                                    submissionId
                                ]);
                                
                                // Update form status to awaiting_supervisor_consent
                                await pool.query(`
                                    UPDATE form_submissions 
                                    SET status = 'awaiting_supervisor_consent', last_updated_at = CURRENT_TIMESTAMP
                                    WHERE id = $1
                                `, [submissionId]);
                                
                                // Create a new Supervisor Consent Form submission for the supervisor to fill
                                const consentFormTypeQuery = await pool.query(`
                                    SELECT id FROM form_types WHERE form_code = 'PHDEE02-A'
                                `);
                                
                                if (consentFormTypeQuery.rows.length > 0) {
                                    const consentFormTypeId = consentFormTypeQuery.rows[0].id;
                                    
                                    // Create the supervisor consent form submission
                                    await pool.query(`
                                        INSERT INTO form_submissions (
                                            user_id, form_type_id, status, submitted_at, 
                                            form_data, dprc_approval_status, supervisor_approval_status,
                                            hod_approval_status, chairperson_approval_status, gec_approval_status
                                        ) VALUES (
                                            $1, $2, 'submitted', CURRENT_TIMESTAMP,
                                            $3, 'not_required', 'pending', 'not_required', 'not_required', 'not_required'
                                        )
                                    `, [
                                        supervisor.user_id, // supervisor's user ID
                                        consentFormTypeId,
                                        JSON.stringify({
                                            original_onboarding_submission_id: submissionId,
                                            student_id: student.student_id,
                                            student_name: `${student.first_name} ${student.last_name}`,
                                            supervisor_id: supervisor.id,
                                            supervisor_name: `${supervisor.first_name} ${supervisor.last_name}`
                                        })
                                    ]);
                                    
                                    console.log(`Created Supervisor Consent Form submission for supervisor ${supervisor.first_name} ${supervisor.last_name} for student ${student.first_name} ${student.last_name}`);
                                }
                                
                                console.log(`Notification sent to supervisor ${supervisor.first_name} ${supervisor.last_name} for student ${student.first_name} ${student.last_name}`);
                            }
                        } else {
                            console.log(`Supervisor with email ${supervisorEmail} not found in faculty table`);
                        }
                    } else {
                        console.log(`No supervisor email found in form data for submission ${submissionId}`);
                    }
                } else {
                    // For ONBOARDING-001: After DPRC approval, form is complete and student can submit Supervisor Consent Form
                    if (formType.form_code === 'ONBOARDING-001') {
                        await pool.query(`
                            UPDATE form_submissions 
                            SET status = 'approved_by_dprc', final_approval_status = 'approved', final_approved_at = CURRENT_TIMESTAMP
                            WHERE id = $1
                        `, [submissionId]);
                    }
                    // For PHDEE02-A: After DPRC approval, send to supervisor for approval
                    else if (formType.form_code === 'PHDEE02-A') {
                        // Ensure the student's primary_supervisor_id is set before sending to supervisor
                        const supervisorQuery = await pool.query(`
                            SELECT u.primary_supervisor_id, f.id as faculty_id
                            FROM users u
                            JOIN faculty f ON u.primary_supervisor_id = f.id
                            WHERE u.id = $1
                        `, [formData.user_id]);

                        let supervisorId = null;
                        if (supervisorQuery.rows.length > 0) {
                            supervisorId = supervisorQuery.rows[0].primary_supervisor_id;
                        } else if (formData.supervisor_id) {
                            // fallback: use supervisor_id from form data if available
                            supervisorId = formData.supervisor_id;
                            await pool.query(`
                                UPDATE users SET primary_supervisor_id = $1 WHERE id = $2
                            `, [supervisorId, formData.user_id]);
                        }

                        if (supervisorId) {
                            // Set the student's primary_supervisor_id if not already set
                            await pool.query(`
                                UPDATE users SET primary_supervisor_id = $1 WHERE id = $2
                            `, [supervisorId, formData.user_id]);
                        }

                        // Fallback: If status is still 'approved_by_dprc', force transition to 'awaiting_supervisor_consent'
                        const statusCheck = await pool.query(`
                            SELECT status FROM form_submissions WHERE id = $1
                        `, [submissionId]);
                        if (statusCheck.rows.length > 0 && statusCheck.rows[0].status === 'approved_by_dprc') {
                            await pool.query(`
                                UPDATE form_submissions 
                                SET status = 'awaiting_supervisor_consent', last_updated_at = CURRENT_TIMESTAMP
                                WHERE id = $1
                            `, [submissionId]);
                        }

                        // Get supervisor information for notification
                        const notifySupervisorQuery = await pool.query(`
                            SELECT u.primary_supervisor_id, f.first_name, f.last_name, f.email
                            FROM users u
                            JOIN faculty f ON u.primary_supervisor_id = f.id
                            WHERE u.id = $1
                        `, [formData.user_id]);
                        if (notifySupervisorQuery.rows.length > 0) {
                            const supervisor = notifySupervisorQuery.rows[0];
                            // Create notification for supervisor
                            await pool.query(`
                                INSERT INTO notifications (
                                    recipient_id, recipient_type, title, message, notification_type,
                                    action_required, action_url, related_form_id
                                ) VALUES ($1, 'faculty', $2, $3, 'approval_request', true, $4, $5)
                            `, [
                                supervisor.primary_supervisor_id,
                                'Supervisor Consent Form Requires Approval',
                                `DPRC has approved the Supervisor Consent Form for ${formData.student_name}. Please review and approve.`,
                                '/faculty/approvals',
                                submissionId
                            ]);
                        }
                    }
                    // For other forms, check if all required approvals are complete
                    else {
                        let allApproved = true;
                        
                        if (formType.requires_dec_approval && formData.dec_approval_status !== 'approved') allApproved = false;
                        if (formType.requires_dprc_approval && formData.dprc_approval_status !== 'approved') allApproved = false;
                        if (formType.requires_supervisor_approval && formData.supervisor_approval_status !== 'approved') allApproved = false;
                        if (formType.requires_gec_approval && formData.gec_approval_status !== 'approved') allApproved = false;
                        
                        if (allApproved && formData.dprc_approval_status === 'approved') {
                            // Update final approval status
                            await pool.query(`
                                UPDATE form_submissions 
                                SET final_approval_status = 'approved', final_approved_at = CURRENT_TIMESTAMP
                                WHERE id = $1
                            `, [submissionId]);
                        }
                    }
                }
            }
        }

            // Determine the next step message
            let nextStepMessage = '';
            if (formTypeResult.rows.length > 0) {
                const formType = formTypeResult.rows[0];
                if ((formType.form_code === 'ONBOARDING-001' || formType.form_code === 'PHDEE02-A') && formData.dprc_approval_status === 'approved') {
                    nextStepMessage = 'Supervisor will be notified to fill the consent form.';
                } else if (formData.dprc_approval_status === 'approved') {
                    nextStepMessage = 'Form has been approved by DPRC.';
                } else if (formData.dprc_approval_status === 'rejected') {
                    nextStepMessage = 'Form has been rejected by DPRC.';
                }
            }

            res.json({
                success: true,
                message: `Form ${action}d successfully by DPRC. ${nextStepMessage}`,
                data: {
                    submission_id: submissionId,
                    your_decision: status,
                    overall_status: formData.overall_status,
                    approved_by: formData.approved_by || [],
                    rejected_by: formData.rejected_by || [],
                    pending_members: formData.pending_members || [],
                    progress: `${formData.approved_count || 0}/${formData.total_members || 0} approved`,
                    next_step: nextStepMessage
                }
            });

        } catch (error) {
            console.error('Error processing DPRC approval:', error);
            res.status(500).json({
                success: false,
                message: 'Error processing DPRC approval',
                error: error.message
            });
        }
    }

    // Get form submission details for DPRC member
    static async getDPRCFormDetails(req, res) {
        try {
            const { submissionId } = req.params;
            const userId = req.user.id;

            // Verify DPRC member access
            const accessCheck = await pool.query(`
                SELECT 
                    fs.id,
                    u.department_id as student_dept_id,
                    dma.id as dprc_assignment_id
                FROM form_submissions fs
                JOIN users u ON fs.user_id = u.id
                JOIN users faculty_user ON faculty_user.id = $2
                JOIN faculty f ON faculty_user.email = f.email
                JOIN dprc_member_assignments dma ON f.id = dma.faculty_id
                JOIN dprc_committees dp ON dma.dprc_committee_id = dp.id
                WHERE fs.id = $1 
                AND dp.department_id = u.department_id
                AND dma.is_active = true
                AND dp.is_active = true
            `, [submissionId, userId]);

            if (accessCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You are not authorized to view this form.'
                });
            }

            // Get detailed submission information
            const query = `
                SELECT 
                    fs.*,
                    ft.form_code,
                    ft.form_name,
                    ft.description,
                    ft.workflow_stage,
                    ft.form_schema,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.email as student_email,
                    u.student_id,
                    u.current_semester,
                    u.academic_year,
                    u.research_area,
                    d.dept_name as department,
                    d.dept_code as department_code,
                    f1.first_name || ' ' || f1.last_name as primary_supervisor_name,
                    f1.email as primary_supervisor_email,
                    f2.first_name || ' ' || f2.last_name as co_supervisor_name,
                    f2.email as co_supervisor_email
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
                LEFT JOIN faculty f2 ON u.co_supervisor_id = f2.id
                WHERE fs.id = $1
            `;

            const result = await pool.query(query, [submissionId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Submission not found'
                });
            }

            const submission = result.rows[0];

            // Get attachments
            const attachmentsQuery = `
                SELECT id, file_name, file_type, upload_type, uploaded_at, is_verified, verification_comments
                FROM form_attachments 
                WHERE form_submission_id = $1
                ORDER BY uploaded_at DESC
            `;

            const attachments = await pool.query(attachmentsQuery, [submissionId]);

            res.json({
                success: true,
                data: {
                    ...submission,
                    attachments: attachments.rows
                }
            });

        } catch (error) {
            console.error('Error fetching DPRC form details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch form details',
                error: error.message
            });
        }
    }

    // Get all faculty members with their roles
    static async getAllFaculty(req, res) {
        try {
            const query = `
                SELECT 
                    f.*,
                    d.dept_name,
                    d.dept_code,
                    ARRAY_AGG(DISTINCT fr.role) FILTER (WHERE fr.is_active = true) as roles,
                    COUNT(DISTINCT u1.id) as supervised_phd_students,
                    COUNT(DISTINCT u2.id) as co_supervised_students
                FROM faculty f
                LEFT JOIN departments d ON f.department_id = d.id
                LEFT JOIN faculty_roles fr ON f.id = fr.faculty_id AND fr.is_active = true
                LEFT JOIN users u1 ON f.id = u1.primary_supervisor_id
                LEFT JOIN users u2 ON f.id = u2.co_supervisor_id
                WHERE f.is_active = true
                GROUP BY f.id, d.dept_name, d.dept_code
                ORDER BY f.last_name, f.first_name
            `;
            
            const result = await pool.query(query);
            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching faculty members',
                error: error.message
            });
        }
    }

    // Get faculty by ID with detailed information
    static async getFacultyById(req, res) {
        try {
            const { id } = req.params;
            
            const query = `
                SELECT 
                    f.*,
                    d.dept_name,
                    d.dept_code,
                    ARRAY_AGG(DISTINCT fr.role) FILTER (WHERE fr.is_active = true) as roles
                FROM faculty f
                LEFT JOIN departments d ON f.department_id = d.id
                LEFT JOIN faculty_roles fr ON f.id = fr.faculty_id AND fr.is_active = true
                WHERE f.id = $1 AND f.is_active = true
                GROUP BY f.id, d.dept_name, d.dept_code
            `;
            
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty member not found'
                });
            }
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error fetching faculty by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching faculty member',
                error: error.message
            });
        }
    }

    // Add new faculty member (Admin only)
    static async addFaculty(req, res) {
        try {
            const {
                faculty_id, first_name, last_name, email, title, designation,
                department_id, institution = 'ITU', office_location, contact_no,
                research_interests, research_areas, qualification, experience_years,
                max_phd_students = 8, max_ms_students = 12, hec_approved = false,
                hec_approval_ref, hec_approval_date, roles = []
            } = req.body;

            // Validate required fields
            if (!faculty_id || !first_name || !last_name || !email || !department_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Required fields missing'
                });
            }

            // Check if faculty ID or email already exists
            const existingCheck = await pool.query(
                'SELECT id FROM faculty WHERE faculty_id = $1 OR email = $2',
                [faculty_id, email]
            );

            if (existingCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Faculty ID or email already exists'
                });
            }

            // Insert faculty member
            const facultyQuery = `
                INSERT INTO faculty (
                    faculty_id, first_name, last_name, email, title, designation,
                    department_id, institution, office_location, contact_no,
                    research_interests, research_areas, qualification, experience_years,
                    max_phd_students, max_ms_students, hec_approved, hec_approval_ref, hec_approval_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                RETURNING id, faculty_id, first_name, last_name, email
            `;

            const facultyResult = await pool.query(facultyQuery, [
                faculty_id, first_name, last_name, email, title, designation,
                department_id, institution, office_location, contact_no,
                research_interests, research_areas, qualification, experience_years,
                max_phd_students, max_ms_students, hec_approved, hec_approval_ref, hec_approval_date
            ]);

            const newFacultyId = facultyResult.rows[0].id;

            // Assign roles if provided
            if (roles && roles.length > 0) {
                for (const role of roles) {
                    await pool.query(
                        'INSERT INTO faculty_roles (faculty_id, role, department_id, assigned_by) VALUES ($1, $2, $3, $4)',
                        [newFacultyId, role, department_id, req.user.id]
                    );
                }
            }

            res.status(201).json({
                success: true,
                message: 'Faculty member added successfully',
                data: facultyResult.rows[0]
            });

        } catch (error) {
            console.error('Error adding faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding faculty member',
                error: error.message
            });
        }
    }

    // Update faculty member (Admin only)
    static async updateFaculty(req, res) {
        try {
            const { id } = req.params;
            const updateFields = req.body;

            // Build dynamic update query
            const allowedFields = [
                'first_name', 'last_name', 'email', 'title', 'designation',
                'department_id', 'office_location', 'contact_no', 'research_interests',
                'research_areas', 'qualification', 'experience_years', 'max_phd_students',
                'max_ms_students', 'hec_approved', 'hec_approval_ref', 'hec_approval_date',
                'is_active', 'can_supervise'
            ];

            const updates = [];
            const values = [];
            let paramCount = 1;

            for (const [key, value] of Object.entries(updateFields)) {
                if (allowedFields.includes(key)) {
                    updates.push(`${key} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }

            values.push(id);
            const query = `
                UPDATE faculty 
                SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty member not found'
                });
            }

            res.json({
                success: true,
                message: 'Faculty member updated successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error updating faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating faculty member',
                error: error.message
            });
        }
    }

    // Assign role to faculty member
    static async assignRole(req, res) {
        try {
            const { faculty_id, role, department_id, notes } = req.body;

            if (!faculty_id || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Faculty ID and role are required'
                });
            }

            // Check if faculty exists
            const facultyCheck = await pool.query(
                'SELECT id FROM faculty WHERE id = $1 AND is_active = true',
                [faculty_id]
            );

            if (facultyCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty member not found'
                });
            }

            // Check if role already assigned
            const existingRole = await pool.query(
                'SELECT id FROM faculty_roles WHERE faculty_id = $1 AND role = $2 AND is_active = true',
                [faculty_id, role]
            );

            if (existingRole.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Role already assigned to this faculty member'
                });
            }

            // Assign role
            const result = await pool.query(`
                INSERT INTO faculty_roles (faculty_id, role, department_id, assigned_by, notes)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [faculty_id, role, department_id, req.user.id, notes]);

            res.status(201).json({
                success: true,
                message: 'Role assigned successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error assigning role:', error);
            res.status(500).json({
                success: false,
                message: 'Error assigning role',
                error: error.message
            });
        }
    }

    // Remove role from faculty member
    static async removeRole(req, res) {
        try {
            const { faculty_id, role } = req.body;

            const result = await pool.query(`
                UPDATE faculty_roles 
                SET is_active = false 
                WHERE faculty_id = $1 AND role = $2 AND is_active = true
                RETURNING *
            `, [faculty_id, role]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Role assignment not found'
                });
            }

            res.json({
                success: true,
                message: 'Role removed successfully'
            });

        } catch (error) {
            console.error('Error removing role:', error);
            res.status(500).json({
                success: false,
                message: 'Error removing role',
                error: error.message
            });
        }
    }

    // Get faculty members by role
    static async getFacultyByRole(req, res) {
        try {
            const { role, department_id } = req.query;

            let query = `
                SELECT DISTINCT f.*, d.dept_name
                FROM faculty f
                JOIN faculty_roles fr ON f.id = fr.faculty_id
                LEFT JOIN departments d ON f.department_id = d.id
                WHERE fr.role = $1 AND fr.is_active = true AND f.is_active = true
            `;
            const params = [role];

            if (department_id) {
                query += ` AND f.department_id = $2`;
                params.push(department_id);
            }

            query += ` ORDER BY f.last_name, f.first_name`;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching faculty by role:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching faculty by role',
                error: error.message
            });
        }
    }

    // Get pending approvals for faculty member
    static async getPendingApprovals(req, res) {
        try {
            const { faculty_id } = req.params;

            // First, determine if the ID is a user ID or faculty ID
            let actualFacultyId = faculty_id;
            
            // Check if it's a user ID (faculty user in users table)
            const userCheckQuery = `
                SELECT f.id as faculty_id 
                FROM users u
                JOIN faculty f ON u.email = f.email
                WHERE u.id = $1 AND u.role = 'faculty' AND u.is_active = true
            `;
            
            const userCheckResult = await pool.query(userCheckQuery, [faculty_id]);
            if (userCheckResult.rows.length > 0) {
                actualFacultyId = userCheckResult.rows[0].faculty_id;
                console.log(`Converted user ID ${faculty_id} to faculty ID ${actualFacultyId}`);
            } else {
                // Check if it's already a faculty ID
                const facultyCheckQuery = `
                    SELECT id FROM faculty WHERE id = $1 AND is_active = true
                `;
                const facultyCheckResult = await pool.query(facultyCheckQuery, [faculty_id]);
                if (facultyCheckResult.rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Faculty not found'
                    });
                }
                actualFacultyId = faculty_id;
            }

            const query = `
                SELECT 
                    fs.id,
                    fs.submitted_at,
                    ft.form_name,
                    ft.form_code,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    CASE 
                        -- Special handling for supervisor consent forms
                        WHEN (ft.form_code = 'ONBOARDING-001' OR ft.form_code = 'PHDEE02-A') AND fs.status = 'awaiting_supervisor_consent' THEN 'supervisor_consent'
                        -- Regular approval stages (only DPRC, Supervisor, and GEC as requested)
                        WHEN fs.dec_approval_status = 'pending' AND EXISTS(
                            SELECT 1 FROM faculty_roles fr WHERE fr.faculty_id = $1 AND fr.role = 'dec_member' AND fr.is_active = true
                        ) THEN 'dec'
                        WHEN fs.supervisor_approval_status = 'pending' AND (
                            fs.supervisor_approved_by = $1 OR u.primary_supervisor_id = $1 OR u.co_supervisor_id = $1
                        ) THEN 'supervisor'
                        WHEN fs.gec_approval_status = 'pending' AND EXISTS(
                            SELECT 1 FROM gec_committee_members gcm 
                            JOIN gec_committees gc ON gcm.committee_id = gc.id 
                            WHERE gc.student_user_id = u.id AND gcm.faculty_id = $1 AND gcm.is_active = true
                        ) THEN 'gec'
                    END as approval_stage
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                WHERE (
                    -- Special case for supervisor consent forms
                    ((ft.form_code = 'ONBOARDING-001' OR ft.form_code = 'PHDEE02-A') AND fs.status = 'awaiting_supervisor_consent') OR
                    -- Regular approval cases (only DPRC, Supervisor, and GEC as requested)
                    (fs.dec_approval_status = 'pending' AND EXISTS(
                        SELECT 1 FROM faculty_roles fr WHERE fr.faculty_id = $1 AND fr.role = 'dec_member' AND fr.is_active = true
                    )) OR
                    (fs.supervisor_approval_status = 'pending' AND (
                        fs.supervisor_approved_by = $1 OR u.primary_supervisor_id = $1 OR u.co_supervisor_id = $1
                    )) OR
                    (fs.gec_approval_status = 'pending' AND EXISTS(
                        SELECT 1 FROM gec_committee_members gcm 
                        JOIN gec_committees gc ON gcm.committee_id = gc.id 
                        WHERE gc.student_user_id = u.id AND gcm.faculty_id = $1 AND gcm.is_active = true
                    ))
                )
                AND fs.status IN ('submitted', 'awaiting_supervisor_consent')
                ORDER BY fs.submitted_at DESC
            `;

            const result = await pool.query(query, [actualFacultyId]);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching pending approvals:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching pending approvals',
                error: error.message
            });
        }
    }

    // Approve/Reject form submission
    static async approveForm(req, res) {
        try {
            // Handle both route formats
            let form_submission_id, approval_stage, status, comments;
            
            if (req.params.submissionId && req.params.action) {
                // New route format: /forms/submissions/:submissionId/:action
                form_submission_id = req.params.submissionId;
                // Convert action to proper enum value
                status = req.params.action === 'approve' ? 'approved' : 
                        req.params.action === 'reject' ? 'rejected' : req.params.action;
                comments = req.body.comments || '';
                
                // Determine approval stage based on the form submission
                const submissionQuery = `
                    SELECT ft.form_code, fs.status, fs.supervisor_approval_status, fs.hod_approval_status, fs.chairperson_approval_status
                    FROM form_submissions fs
                    JOIN form_types ft ON fs.form_type_id = ft.id
                    WHERE fs.id = $1
                `;
                const submissionResult = await pool.query(submissionQuery, [form_submission_id]);
                
                if (submissionResult.rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Form submission not found'
                    });
                }
                
                const submission = submissionResult.rows[0];
                
                // Determine which stage needs approval
                if (submission.supervisor_approval_status === 'pending') {
                    approval_stage = 'supervisor';
                } else if (submission.hod_approval_status === 'pending') {
                    approval_stage = 'hod';
                } else if (submission.chairperson_approval_status === 'pending') {
                    approval_stage = 'chairperson';
                } else {
                    // Check if this is a supervisor consent form that needs supervisor action
                    const statusQuery = `
                        SELECT status FROM form_submissions WHERE id = $1
                    `;
                    const statusResult = await pool.query(statusQuery, [form_submission_id]);
                    if (statusResult.rows.length > 0 && statusResult.rows[0].status === 'awaiting_supervisor_consent') {
                        approval_stage = 'supervisor';
                    } else {
                        return res.status(400).json({
                            success: false,
                            message: 'No pending approval stage found for this submission'
                        });
                    }
                }
            } else {
                // Original route format
                form_submission_id = req.body.form_submission_id;
                approval_stage = req.body.approval_stage;
                status = req.body.status;
                comments = req.body.comments;
            }
            
            // Convert user ID to faculty ID if needed
            let actualFacultyId = req.user.faculty_id || req.user.id;
            
            // Check if it's a user ID (faculty user in users table)
            const userCheckQuery = `
                SELECT f.id as faculty_id 
                FROM users u
                JOIN faculty f ON u.email = f.email
                WHERE u.id = $1 AND u.role = 'faculty' AND u.is_active = true
            `;
            
            const userCheckResult = await pool.query(userCheckQuery, [actualFacultyId]);
            if (userCheckResult.rows.length > 0) {
                actualFacultyId = userCheckResult.rows[0].faculty_id;
                console.log(`Converted user ID ${req.user.id} to faculty ID ${actualFacultyId} for approval`);
            } else {
                // Check if it's already a faculty ID
                const facultyCheckQuery = `
                    SELECT id FROM faculty WHERE id = $1 AND is_active = true
                `;
                const facultyCheckResult = await pool.query(facultyCheckQuery, [actualFacultyId]);
                if (facultyCheckResult.rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Faculty not found'
                    });
                }
            }

            if (!form_submission_id || !approval_stage || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Form submission ID, approval stage, and status are required'
                });
            }

            // Check if this is a supervisor consent form that should use different approval logic
            const formTypeQuery = `
                SELECT ft.form_code, fs.status 
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                WHERE fs.id = $1
            `;
            const formTypeResult = await pool.query(formTypeQuery, [form_submission_id]);
            
            // If this is a PHDEE02-A (Supervisor Consent Form) and status is awaiting_supervisor_consent,
            // redirect to supervisor consent endpoint logic
            if (formTypeResult.rows.length > 0 && 
                formTypeResult.rows[0].form_code === 'PHDEE02-A' && 
                formTypeResult.rows[0].status === 'awaiting_supervisor_consent') {
                
                // Handle supervisor consent approval directly
                const studentQuery = await pool.query(`
                    SELECT fs.user_id, u.primary_supervisor_id
                    FROM form_submissions fs
                    JOIN users u ON fs.user_id = u.id
                    WHERE fs.id = $1
                `, [form_submission_id]);
                
                if (studentQuery.rows.length === 0 || studentQuery.rows[0].primary_supervisor_id !== actualFacultyId) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not authorized to approve this supervisor consent form'
                    });
                }
                
                const studentUserId = studentQuery.rows[0].user_id;
                
                if (status === 'approved') {
                    // Approve the consent form - mark as approved and enable GEC formation
                    await pool.query(`
                        UPDATE form_submissions 
                        SET 
                            status = 'approved',
                            final_approval_status = 'approved',
                            supervisor_approval_status = 'approved',
                            supervisor_approved_by = $1,
                            supervisor_approved_at = CURRENT_TIMESTAMP,
                            last_updated_at = CURRENT_TIMESTAMP
                        WHERE id = $2
                    `, [actualFacultyId, form_submission_id]);
                    
                    // Create notification for student
                    await pool.query(`
                        INSERT INTO notifications (
                            recipient_id, recipient_type, title, message, notification_type
                        ) VALUES ($1, 'student', $2, $3, 'success')
                    `, [
                        studentUserId,
                        'Supervisor Assigned Successfully',
                        'Your supervisor has been assigned and you can now proceed to GEC formation.'
                    ]);
                    
                } else if (status === 'rejected') {
                    // Reject the consent form
                    await pool.query(`
                        UPDATE form_submissions 
                        SET status = 'rejected_by_supervisor', 
                            supervisor_approval_status = 'rejected',
                            supervisor_approved_by = $1,
                            supervisor_approved_at = CURRENT_TIMESTAMP,
                            supervisor_comments = $2,
                            last_updated_at = CURRENT_TIMESTAMP
                        WHERE id = $3
                    `, [actualFacultyId, comments || 'Supervisor rejected the consent form', form_submission_id]);
                    
                    // Remove supervisor assignment
                    await pool.query(`
                        UPDATE users 
                        SET primary_supervisor_id = NULL, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                    `, [studentUserId]);
                    
                    // Create notification for student
                    await pool.query(`
                        INSERT INTO notifications (
                            recipient_id, recipient_type, title, message, notification_type
                        ) VALUES ($1, 'student', $2, $3, 'warning')
                    `, [
                        studentUserId,
                        'Supervisor Consent Rejected',
                        `Your supervisor has rejected the consent form. You can select another supervisor and resubmit. Reason: ${comments || 'No specific reason provided'}`
                    ]);
                }
                
                return res.json({
                    success: true,
                    message: `Supervisor consent form ${status} successfully`,
                    data: {
                        submissionId: form_submission_id,
                        status: status,
                        approvedBy: actualFacultyId
                    }
                });
            }

            // Verify faculty has permission to approve at this stage (for other forms)
            const permissionQuery = `
                SELECT 1 FROM faculty f
                LEFT JOIN faculty_roles fr ON f.id = fr.faculty_id
                LEFT JOIN form_submissions fs ON fs.id = $1
                LEFT JOIN users u ON fs.user_id = u.id
                LEFT JOIN gec_committee_members gcm ON gcm.faculty_id = f.id
                LEFT JOIN gec_committees gc ON gcm.committee_id = gc.id AND gc.student_user_id = u.id
                WHERE f.id = $2 AND (
                    ($3 = 'dec' AND fr.role = 'dec_member' AND fr.is_active = true) OR
                    ($3 = 'supervisor' AND (u.primary_supervisor_id = f.id OR u.co_supervisor_id = f.id)) OR
                    ($3 = 'gec' AND gcm.is_active = true) OR
                    ($3 = 'hod' AND fr.role = 'hod' AND fr.is_active = true) OR
                    ($3 = 'chairperson' AND fr.role = 'chairperson' AND fr.is_active = true)
                )
            `;

            const permissionResult = await pool.query(permissionQuery, [form_submission_id, actualFacultyId, approval_stage]);

            if (permissionResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to approve at this stage'
                });
            }

            // Update approval status
            const updateResult = await pool.query(
                'SELECT update_form_approval_status($1, $2, $3, $4, $5)',
                [form_submission_id, approval_stage, status, actualFacultyId, comments]
            );

            if (updateResult.rows[0].update_form_approval_status) {
                // Special handling for onboarding forms - auto-finalize after supervisor approval
                if (approval_stage === 'supervisor' && status === 'approved') {
                    const checkOnboardingQuery = `
                        SELECT ft.form_code, fs.supervisor_approval_status, fs.hod_approval_status, fs.chairperson_approval_status
                        FROM form_submissions fs
                        JOIN form_types ft ON fs.form_type_id = ft.id
                        WHERE fs.id = $1
                    `;
                    
                    const onboardingResult = await pool.query(checkOnboardingQuery, [form_submission_id]);
                    
                    if (onboardingResult.rows.length > 0) {
                        const submission = onboardingResult.rows[0];
                        
                        // If this is an onboarding form and all required approvals are complete, finalize it
                        if (submission.form_code === 'ONBOARDING-001' && 
                            submission.supervisor_approval_status === 'approved' &&
                            submission.hod_approval_status === 'not_required' &&
                            submission.chairperson_approval_status === 'not_required') {
                            
                            await pool.query(`
                                UPDATE form_submissions 
                                SET 
                                    status = 'approved',
                                    final_approval_status = 'approved',
                                    final_approved_at = CURRENT_TIMESTAMP,
                                    last_updated_at = CURRENT_TIMESTAMP
                                WHERE id = $1
                            `, [form_submission_id]);
                            
                            console.log(`Onboarding form ${form_submission_id} auto-finalized after supervisor approval`);
                        }
                    }
                }

                            // Handle special workflow cases
            if (approval_stage === 'supervisor' && status === 'approved') {
                // Check if this is an onboarding form
                const formTypeQuery = `
                    SELECT ft.form_code
                    FROM form_submissions fs
                    JOIN form_types ft ON fs.form_type_id = ft.id
                    WHERE fs.id = $1
                `;
                const formTypeResult = await pool.query(formTypeQuery, [form_submission_id]);
                
                if (formTypeResult.rows.length > 0 && formTypeResult.rows[0].form_code === 'ONBOARDING-001') {
                    // Handle onboarding approval workflow
                    const workflowResult = await WorkflowService.handleOnboardingApproval(
                        form_submission_id, 
                        actualFacultyId, 
                        status
                    );
                    
                    if (workflowResult.success && workflowResult.requiresConsentForm) {
                        return res.json({
                            success: true,
                            message: workflowResult.message,
                            requiresConsentForm: true
                        });
                    }
                }
            }

            res.json({
                success: true,
                message: `Form ${status} successfully`
            });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error updating approval status'
                });
            }

        } catch (error) {
            console.error('Error approving form:', error);
            res.status(500).json({
                success: false,
                message: 'Error processing approval',
                error: error.message
            });
        }
    }

    // Get form submission details for viewing
    static async getFormSubmissionDetails(req, res) {
        try {
            const { submissionId } = req.params;
            const facultyId = req.user.faculty_id || req.user.id;

            // Convert user ID to faculty ID if needed
            let actualFacultyId = facultyId;
            const userCheckQuery = `
                SELECT f.id as faculty_id 
                FROM users u
                JOIN faculty f ON u.email = f.email
                WHERE u.id = $1 AND u.role = 'faculty' AND u.is_active = true
            `;
            
            const userCheckResult = await pool.query(userCheckQuery, [facultyId]);
            if (userCheckResult.rows.length > 0) {
                actualFacultyId = userCheckResult.rows[0].faculty_id;
            }

            // Get detailed submission information
            const query = `
                SELECT 
                    fs.*,
                    ft.form_code,
                    ft.form_name,
                    ft.description,
                    ft.workflow_stage,
                    ft.form_schema,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.email as student_email,
                    u.student_id,
                    u.current_semester,
                    u.academic_year,
                    d.dept_name as department,
                    d.dept_code as department_code,
                    f1.first_name || ' ' || f1.last_name as primary_supervisor_name,
                    f1.email as primary_supervisor_email,
                    f2.first_name || ' ' || f2.last_name as co_supervisor_name,
                    f2.email as co_supervisor_email
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
                LEFT JOIN faculty f2 ON u.co_supervisor_id = f2.id
                WHERE fs.id = $1
            `;

            const result = await pool.query(query, [submissionId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Submission not found'
                });
            }

            const submission = result.rows[0];

            // Check if faculty has permission to view this submission
            const hasPermission = await FacultyController.checkFacultyPermission(actualFacultyId, submission);
            
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to view this submission'
                });
            }

            // Get attachments
            const attachmentsQuery = `
                SELECT id, file_name, file_type, upload_type, uploaded_at, is_verified, verification_comments
                FROM form_attachments 
                WHERE form_submission_id = $1
                ORDER BY uploaded_at DESC
            `;

            const attachments = await pool.query(attachmentsQuery, [submissionId]);

            // Get approval history
            const historyQuery = `
                SELECT 
                    fah.approval_stage,
                    fah.previous_status,
                    fah.new_status,
                    fah.comments,
                    fah.action_date,
                    f.first_name || ' ' || f.last_name as approved_by_name,
                    f.email as approved_by_email
                FROM form_approval_history fah
                LEFT JOIN faculty f ON fah.approved_by = f.id
                WHERE fah.form_submission_id = $1
                ORDER BY fah.action_date DESC
            `;

            const history = await pool.query(historyQuery, [submissionId]);

            res.json({
                success: true,
                data: {
                    ...submission,
                    attachments: attachments.rows,
                    approval_history: history.rows
                }
            });

        } catch (error) {
            console.error('Error fetching form submission details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch submission details',
                error: error.message
            });
        }
    }

    // Helper method to check faculty permission
    static async checkFacultyPermission(facultyId, submission) {
        try {
            // Check if faculty is supervisor of the student
            const supervisorCheck = await pool.query(`
                SELECT 1 FROM users 
                WHERE id = $1 AND (primary_supervisor_id = $2 OR co_supervisor_id = $2)
            `, [submission.user_id, facultyId]);

            if (supervisorCheck.rows.length > 0) {
                return true;
            }

            // Check if faculty has HOD role for the student's department
            const hodCheck = await pool.query(`
                SELECT 1 FROM faculty_roles fr
                JOIN users u ON u.department_id = fr.department_id
                WHERE fr.faculty_id = $1 AND fr.role = 'hod' AND fr.is_active = true
                AND u.id = $2
            `, [facultyId, submission.user_id]);

            if (hodCheck.rows.length > 0) {
                return true;
            }

            // Check if faculty is chairperson
            const chairpersonCheck = await pool.query(`
                SELECT 1 FROM faculty_roles 
                WHERE faculty_id = $1 AND role = 'chairperson' AND is_active = true
            `, [facultyId]);

            if (chairpersonCheck.rows.length > 0) {
                return true;
            }

            // Check if faculty is GEC member for this student
            const gecCheck = await pool.query(`
                SELECT 1 FROM gec_committee_members gcm
                JOIN gec_committees gc ON gcm.committee_id = gc.id
                WHERE gcm.faculty_id = $1 AND gc.student_user_id = $2 AND gcm.is_active = true
            `, [facultyId, submission.user_id]);

            if (gecCheck.rows.length > 0) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking faculty permission:', error);
            return false;
        }
    }

    // Get faculty workload summary
    static async getWorkloadSummary(req, res) {
        try {
            const query = `
                SELECT * FROM faculty_workload_summary
                ORDER BY department, faculty_name
            `;

            const result = await pool.query(query);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching workload summary:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching workload summary',
                error: error.message
            });
        }
    }
}

module.exports = FacultyController; 
