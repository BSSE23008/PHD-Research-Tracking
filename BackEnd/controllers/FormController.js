const { pool } = require('../config/database');
const WorkflowService = require('../services/WorkflowService');
const NotificationService = require('../services/NotificationService');
const { sendResponse, sendError } = require('../views/ResponseView');

class FormController {
    // Get all available form types
    static async getFormTypes(req, res) {
        try {
            const query = `
                SELECT 
                    id, form_code, form_name, description, workflow_stage,
                    requires_supervisor_approval, requires_admin_approval, requires_gec_approval,
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

    // Get available forms for current user
    static async getAvailableForms(req, res) {
        try {
            const userId = req.user.id;
            const availableForms = await WorkflowService.getAvailableFormsForStudent(userId);

            res.json({
                success: true,
                data: availableForms
            });

        } catch (error) {
            console.error('Error fetching available forms:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch available forms',
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
                    requires_supervisor_approval, requires_admin_approval, requires_gec_approval
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

            if (formType.requires_admin_approval) {
                // Get all admins
                const adminQuery = `SELECT id FROM users WHERE role = 'admin' AND is_active = true`;
                const adminResult = await pool.query(adminQuery);
                
                for (const admin of adminResult.rows) {
                    notifications.push(
                        NotificationService.createNotification({
                            userId: admin.id,
                            title: 'New Form Submission Requires Approval',
                            message: `${formType.form_name} (${formType.form_code}) submitted and requires admin approval`,
                            notificationType: 'info',
                            relatedFormId: submission.id,
                            actionRequired: true,
                            actionUrl: `/admin/approvals/${submission.id}`
                        })
                    );
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
}

module.exports = FormController; 