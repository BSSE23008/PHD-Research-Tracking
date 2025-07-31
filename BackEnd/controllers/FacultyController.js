const { pool } = require('../config/database');
const WorkflowService = require('../services/WorkflowService');

class FacultyController {
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
                        WHEN fs.hod_approval_status = 'pending' AND EXISTS(
                            SELECT 1 FROM faculty_roles fr WHERE fr.faculty_id = $1 AND fr.role = 'hod' AND fr.is_active = true
                        ) THEN 'hod'
                        WHEN fs.chairperson_approval_status = 'pending' AND EXISTS(
                            SELECT 1 FROM faculty_roles fr WHERE fr.faculty_id = $1 AND fr.role = 'chairperson' AND fr.is_active = true
                        ) THEN 'chairperson'
                    END as approval_stage
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                WHERE (
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
                    )) OR
                    (fs.hod_approval_status = 'pending' AND EXISTS(
                        SELECT 1 FROM faculty_roles fr WHERE fr.faculty_id = $1 AND fr.role = 'hod' AND fr.is_active = true
                    )) OR
                    (fs.chairperson_approval_status = 'pending' AND EXISTS(
                        SELECT 1 FROM faculty_roles fr WHERE fr.faculty_id = $1 AND fr.role = 'chairperson' AND fr.is_active = true
                    ))
                )
                AND fs.status = 'submitted'
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
                    SELECT ft.form_code, fs.supervisor_approval_status, fs.hod_approval_status, fs.chairperson_approval_status
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
                    return res.status(400).json({
                        success: false,
                        message: 'No pending approval stage found for this submission'
                    });
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

            // Verify faculty has permission to approve at this stage
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
            const hasPermission = await this.checkFacultyPermission(actualFacultyId, submission);
            
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
