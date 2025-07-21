const db = require('../config/database');

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
            
            const result = await db.query(query);
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
            
            const result = await db.query(query, [id]);
            
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
            const existingCheck = await db.query(
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

            const facultyResult = await db.query(facultyQuery, [
                faculty_id, first_name, last_name, email, title, designation,
                department_id, institution, office_location, contact_no,
                research_interests, research_areas, qualification, experience_years,
                max_phd_students, max_ms_students, hec_approved, hec_approval_ref, hec_approval_date
            ]);

            const newFacultyId = facultyResult.rows[0].id;

            // Assign roles if provided
            if (roles && roles.length > 0) {
                for (const role of roles) {
                    await db.query(
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

            const result = await db.query(query, values);

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
            const facultyCheck = await db.query(
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
            const existingRole = await db.query(
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
            const result = await db.query(`
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

            const result = await db.query(`
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

            const result = await db.query(query, params);

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
                ORDER BY fs.submitted_at DESC
            `;

            const result = await db.query(query, [faculty_id]);

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
            const { form_submission_id, approval_stage, status, comments } = req.body;
            const faculty_id = req.user.faculty_id || req.user.id; // Assuming faculty user

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

            const permissionResult = await db.query(permissionQuery, [form_submission_id, faculty_id, approval_stage]);

            if (permissionResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to approve at this stage'
                });
            }

            // Update approval status
            const updateResult = await db.query(
                'SELECT update_form_approval_status($1, $2, $3, $4, $5)',
                [form_submission_id, approval_stage, status, faculty_id, comments]
            );

            if (updateResult.rows[0].update_form_approval_status) {
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

    // Get faculty workload summary
    static async getWorkloadSummary(req, res) {
        try {
            const query = `
                SELECT * FROM faculty_workload_summary
                ORDER BY department, faculty_name
            `;

            const result = await db.query(query);

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