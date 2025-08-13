const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class AdminController {
    // Create or sync faculty user accounts
    static async createFacultyUserAccounts(req, res) {
        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Get all active faculty members
                const facultyResult = await client.query(`
                    SELECT id, first_name, last_name, email, department_id
                    FROM faculty 
                    WHERE is_active = true
                `);

                let createdCount = 0;
                let updatedCount = 0;

                for (const faculty of facultyResult.rows) {
                    // Check if user account exists
                    const existingUser = await client.query(`
                        SELECT id, role, is_active FROM users WHERE email = $1
                    `, [faculty.email]);

                    // Hash default password
                    const defaultPassword = 'faculty123';
                    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

                    if (existingUser.rows.length === 0) {
                        // Create new faculty user account
                        await client.query(`
                            INSERT INTO users (
                                first_name, last_name, email, password_hash, 
                                role, department_id, is_active
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                        `, [
                            faculty.first_name,
                            faculty.last_name,
                            faculty.email,
                            hashedPassword,
                            'faculty',
                            faculty.department_id,
                            true
                        ]);
                        createdCount++;
                    } else {
                        const user = existingUser.rows[0];
                        // Update existing user to faculty role if needed
                        if (user.role !== 'faculty' || !user.is_active) {
                            await client.query(`
                                UPDATE users 
                                SET role = $1, department_id = $2, is_active = $3, 
                                    first_name = $4, last_name = $5, updated_at = CURRENT_TIMESTAMP
                                WHERE email = $6
                            `, ['faculty', faculty.department_id, true, faculty.first_name, faculty.last_name, faculty.email]);
                            updatedCount++;
                        }
                    }
                }

                await client.query('COMMIT');

                res.json({
                    success: true,
                    message: `Faculty user accounts synchronized successfully`,
                    data: {
                        total_faculty: facultyResult.rows.length,
                        created: createdCount,
                        updated: updatedCount,
                        default_password: 'faculty123',
                        note: 'Faculty members should change their password on first login'
                    }
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error creating faculty user accounts:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating faculty user accounts',
                error: error.message
            });
        }
    }

    // Get faculty user accounts status
    static async getFacultyUserStatus(req, res) {
        try {
            const result = await pool.query(`
                SELECT 
                    f.id as faculty_id,
                    f.faculty_id as faculty_code,
                    f.first_name,
                    f.last_name,
                    f.email,
                    f.designation,
                    f.department_id,
                    d.dept_name,
                    d.dept_code,
                    u.id as user_id,
                    u.role as user_role,
                    u.is_active as user_active,
                    u.last_login,
                    u.created_at as user_created_at,
                    CASE 
                        WHEN u.id IS NULL THEN 'No User Account'
                        WHEN u.role != 'faculty' THEN 'Wrong Role: ' || u.role
                        WHEN u.is_active = false THEN 'User Inactive'
                        ELSE 'Active'
                    END as account_status
                FROM faculty f
                LEFT JOIN departments d ON f.department_id = d.id
                LEFT JOIN users u ON f.email = u.email
                WHERE f.is_active = true
                ORDER BY d.dept_name, f.last_name, f.first_name
            `);

            const summary = await pool.query(`
                SELECT 
                    COUNT(*) as total_faculty,
                    COUNT(u.id) FILTER (WHERE u.role = 'faculty' AND u.is_active = true) as active_accounts,
                    COUNT(*) - COUNT(u.id) FILTER (WHERE u.role = 'faculty' AND u.is_active = true) as missing_accounts
                FROM faculty f
                LEFT JOIN users u ON f.email = u.email AND u.role = 'faculty' AND u.is_active = true
                WHERE f.is_active = true
            `);

            res.json({
                success: true,
                data: {
                    faculty_accounts: result.rows,
                    summary: summary.rows[0]
                }
            });

        } catch (error) {
            console.error('Error fetching faculty user status:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching faculty user status',
                error: error.message
            });
        }
    }

    // Get admin dashboard overview
    static async getDashboard(req, res) {
        try {
            const result = await pool.query('SELECT * FROM admin_dashboard_overview');
            
            // Get recent submissions
            const recentSubmissions = await pool.query(`
                SELECT 
                    fs.id,
                    fs.submitted_at,
                    ft.form_name,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    d.dept_name,
                    CASE 
                        WHEN fs.final_approval_status = 'approved' THEN 'approved'
                        WHEN fs.dec_approval_status = 'rejected' OR fs.supervisor_approval_status = 'rejected' 
                             OR fs.gec_approval_status = 'rejected' OR fs.hod_approval_status = 'rejected' 
                             OR fs.chairperson_approval_status = 'rejected' THEN 'rejected'
                        ELSE 'under_review'
                    END as status
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                ORDER BY fs.submitted_at DESC
                LIMIT 10
            `);

            // Get pending actions by stage
            const pendingActions = await pool.query(`
                SELECT 
                    'DEC Approvals' as category,
                    COUNT(*) as count
                FROM form_submissions 
                WHERE dec_approval_status = 'pending'
                UNION ALL
                SELECT 
                    'DPRC Approvals' as category,
                    COUNT(*) as count
                FROM form_submissions 
                WHERE dprc_approval_status = 'pending'
                UNION ALL
                SELECT 
                    'Supervisor Approvals' as category,
                    COUNT(*) as count
                FROM form_submissions 
                WHERE supervisor_approval_status = 'pending'
                UNION ALL
                SELECT 
                    'GEC Approvals' as category,
                    COUNT(*) as count
                FROM form_submissions 
                WHERE gec_approval_status = 'pending'
                UNION ALL
                SELECT 
                    'HOD Approvals' as category,
                    COUNT(*) as count
                FROM form_submissions 
                WHERE hod_approval_status = 'pending'
                UNION ALL
                SELECT 
                    'Chairperson Approvals' as category,
                    COUNT(*) as count
                FROM form_submissions 
                WHERE chairperson_approval_status = 'pending'
            `);

            res.json({
                success: true,
                data: {
                    overview: result.rows[0],
                    recent_submissions: recentSubmissions.rows,
                    pending_actions: pendingActions.rows
                }
            });

        } catch (error) {
            console.error('Error fetching admin dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching dashboard data',
                error: error.message
            });
        }
    }

    // Add new student (Admin only)
    static async addStudent(req, res) {
        try {
            const {
                student_id, first_name, last_name, email, password,
                department_id, enrollment_year, enrollment_date,
                current_semester = '1st', academic_year, research_area,
                primary_supervisor_id, co_supervisor_id
            } = req.body;

            // Validate required fields
            if (!student_id || !first_name || !last_name || !email || !password || !department_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Required fields missing'
                });
            }

            // Check if student ID or email already exists
            const existingCheck = await pool.query(
                'SELECT id FROM users WHERE student_id = $1 OR email = $2',
                [student_id, email]
            );

            if (existingCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID or email already exists'
                });
            }

            // Hash password
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Insert student
            const result = await pool.query(`
                INSERT INTO users (
                    student_id, first_name, last_name, email, password_hash, role,
                    department_id, enrollment_year, enrollment_date, current_semester,
                    academic_year, research_area, primary_supervisor_id, co_supervisor_id,
                    added_by
                ) VALUES ($1, $2, $3, $4, $5, 'student', $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id, student_id, first_name, last_name, email, current_semester
            `, [
                student_id, first_name, last_name, email, password_hash,
                department_id, enrollment_year, enrollment_date, current_semester,
                academic_year, research_area, primary_supervisor_id, co_supervisor_id,
                req.user.id
            ]);

            // Initialize student workflow progress
            await pool.query(`
                INSERT INTO student_workflow_progress (student_id, current_semester, academic_year)
                VALUES ($1, $2, $3)
            `, [result.rows[0].id, current_semester, academic_year]);

            res.status(201).json({
                success: true,
                message: 'Student added successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error adding student:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding student',
                error: error.message
            });
        }
    }

    // Update student information
    static async updateStudent(req, res) {
        try {
            const { id } = req.params;
            const updateFields = req.body;

            // Build dynamic update query
            const allowedFields = [
                'first_name', 'last_name', 'email', 'department_id', 'enrollment_year',
                'current_semester', 'academic_year', 'research_area', 'primary_supervisor_id',
                'co_supervisor_id', 'is_active'
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
                UPDATE users 
                SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${paramCount} AND role = 'student'
                RETURNING *
            `;

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            res.json({
                success: true,
                message: 'Student updated successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error updating student:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating student',
                error: error.message
            });
        }
    }

    // Get all students with detailed information
    static async getAllStudents(req, res) {
        try {
            const { page = 1, limit = 20, department, semester, search, supervisor_id } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = "WHERE u.role = 'student'";
            const params = [];
            let paramCount = 0;

            // Handle supervisor_id parameter (convert user ID to faculty ID if needed)
            if (supervisor_id) {
                let actualFacultyId = supervisor_id;
                
                // Check if it's a user ID (faculty user in users table)
                const userCheckQuery = `
                    SELECT f.id as faculty_id 
                    FROM users u
                    JOIN faculty f ON u.email = f.email
                    WHERE u.id = $1 AND u.role = 'faculty' AND u.is_active = true
                `;
                
                const userCheckResult = await pool.query(userCheckQuery, [supervisor_id]);
                if (userCheckResult.rows.length > 0) {
                    actualFacultyId = userCheckResult.rows[0].faculty_id;
                    console.log(`Converted supervisor user ID ${supervisor_id} to faculty ID ${actualFacultyId}`);
                } else {
                    // Check if it's already a faculty ID
                    const facultyCheckQuery = `
                        SELECT id FROM faculty WHERE id = $1 AND is_active = true
                    `;
                    const facultyCheckResult = await pool.query(facultyCheckQuery, [supervisor_id]);
                    if (facultyCheckResult.rows.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Faculty not found'
                        });
                    }
                    actualFacultyId = supervisor_id;
                }
                
                paramCount++;
                whereClause += ` AND (u.primary_supervisor_id = $${paramCount} OR u.co_supervisor_id = $${paramCount})`;
                params.push(actualFacultyId);
            }

            if (department) {
                paramCount++;
                whereClause += ` AND u.department_id = $${paramCount}`;
                params.push(department);
            }

            if (semester) {
                paramCount++;
                whereClause += ` AND u.current_semester = $${paramCount}`;
                params.push(semester);
            }

            if (search) {
                paramCount++;
                whereClause += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.student_id ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
                params.push(`%${search}%`);
            }

            const query = `
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
                    swp.current_gpa
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
                LEFT JOIN faculty f2 ON u.co_supervisor_id = f2.id
                LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
                ${whereClause}
                ORDER BY u.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            params.push(limit, offset);
            const result = await pool.query(query, params);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) 
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
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
            console.error('Error fetching students:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching students',
                error: error.message
            });
        }
    }

    // Get student by ID with detailed information
    static async getStudentById(req, res) {
        try {
            const { id } = req.params;

            const query = `
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
                    swp.current_gpa
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
                LEFT JOIN faculty f2 ON u.co_supervisor_id = f2.id
                LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
                WHERE u.id = $1 AND u.role = 'student'
            `;

            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Get recent form submissions
            const formsQuery = `
                SELECT 
                    fs.id,
                    fs.submitted_at,
                    ft.form_name,
                    ft.form_code,
                    CASE 
                        WHEN fs.final_approval_status = 'approved' THEN 'approved'
                        WHEN fs.dec_approval_status = 'rejected' OR fs.supervisor_approval_status = 'rejected' 
                             OR fs.gec_approval_status = 'rejected' OR fs.hod_approval_status = 'rejected' 
                             OR fs.chairperson_approval_status = 'rejected' THEN 'rejected'
                        ELSE 'under_review'
                    END as status
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                WHERE fs.user_id = $1
                ORDER BY fs.submitted_at DESC
                LIMIT 5
            `;

            const formsResult = await pool.query(formsQuery, [id]);

            res.json({
                success: true,
                data: {
                    ...result.rows[0],
                    recent_submissions: formsResult.rows
                }
            });

        } catch (error) {
            console.error('Error fetching student:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching student',
                error: error.message
            });
        }
    }

    // Assign supervisor to student
    static async assignSupervisor(req, res) {
        try {
            const { student_id, supervisor_id, supervisor_type = 'primary' } = req.body;

            if (!student_id || !supervisor_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID and Supervisor ID are required'
                });
            }

            // Check if student exists
            const studentCheck = await pool.query(
                'SELECT id FROM users WHERE id = $1 AND role = $2',
                [student_id, 'student']
            );

            if (studentCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Check if faculty exists and can supervise
            // First try faculty table, then users table (for faculty with login credentials)
            let facultyCheck = await pool.query(
                'SELECT id, max_phd_students, current_phd_students FROM faculty WHERE id = $1 AND is_active = true AND can_supervise = true',
                [supervisor_id]
            );

            let faculty = null;
            let actualFacultyId = supervisor_id;

            if (facultyCheck.rows.length > 0) {
                faculty = facultyCheck.rows[0];
                console.log('Found faculty in faculty table:', faculty);
            } else {
                console.log('Faculty not found in faculty table, checking users table...');
                // Check if it's a faculty user in the users table
                const facultyUserCheck = await pool.query(`
                    SELECT u.id as user_id, f.id as faculty_id, f.max_phd_students, f.current_phd_students 
                    FROM users u
                    JOIN faculty f ON u.email = f.email
                    WHERE u.id = $1 AND u.role = $2 AND u.is_active = true AND f.is_active = true AND f.can_supervise = true
                `, [supervisor_id, 'faculty']);

                if (facultyUserCheck.rows.length > 0) {
                    const result = facultyUserCheck.rows[0];
                    faculty = {
                        id: result.faculty_id,
                        max_phd_students: result.max_phd_students,
                        current_phd_students: result.current_phd_students
                    };
                    actualFacultyId = result.faculty_id; // Use the faculty table ID for foreign key
                    console.log('Found faculty in users table:', faculty);
                } else {
                    // Let's check what faculty records exist for debugging
                    const allFacultyCheck = await pool.query(
                        'SELECT id, first_name, last_name, email, is_active, can_supervise FROM faculty WHERE id = $1',
                        [supervisor_id]
                    );
                    
                    if (allFacultyCheck.rows.length > 0) {
                        const facultyRecord = allFacultyCheck.rows[0];
                        console.log('Faculty record exists but has issues:', facultyRecord);
                        return res.status(400).json({
                            success: false,
                            message: `Faculty found but ${!facultyRecord.is_active ? 'is not active' : 'cannot supervise'}`
                        });
                    }
                    
                    return res.status(404).json({
                        success: false,
                        message: 'Faculty not found or cannot supervise'
                    });
                }
            }

            // Check capacity for primary supervisor
            if (supervisor_type === 'primary' && faculty.current_phd_students >= faculty.max_phd_students) {
                return res.status(400).json({
                    success: false,
                    message: 'Faculty has reached maximum supervision capacity'
                });
            }

            // Update student record
            const field = supervisor_type === 'primary' ? 'primary_supervisor_id' : 'co_supervisor_id';
            const result = await pool.query(`
                UPDATE users 
                SET ${field} = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2 AND role = 'student'
                RETURNING id, first_name, last_name, student_id
            `, [actualFacultyId, student_id]);

            // Update faculty supervision count if primary supervisor
            if (supervisor_type === 'primary') {
                // Update faculty supervision count using the actual faculty ID
                await pool.query(
                    'UPDATE faculty SET current_phd_students = current_phd_students + 1 WHERE id = $1',
                    [actualFacultyId]
                );
            }

            res.json({
                success: true,
                message: `${supervisor_type === 'primary' ? 'Primary' : 'Co'}-supervisor assigned successfully`,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error assigning supervisor:', error);
            res.status(500).json({
                success: false,
                message: 'Error assigning supervisor',
                error: error.message
            });
        }
    }

    // Get all departments with DPRC status
    static async getDepartments(req, res) {
        try {
            const result = await pool.query(`
                SELECT 
                    d.*,
                    COUNT(DISTINCT u.id) as total_students,
                    COUNT(DISTINCT f.id) as total_faculty,
                    -- DPRC status information
                    CASE 
                        WHEN dp.id IS NOT NULL AND dp.is_active = true THEN true
                        ELSE false
                    END as has_dprc,
                    CASE 
                        WHEN COUNT(DISTINCT f.id) >= 4 THEN true
                        ELSE false
                    END as can_form_dprc,
                    dp.id as dprc_id,
                    dp.committee_name,
                    dp.formation_date as dprc_formation_date,
                    dp.chair_faculty_id,
                    chair_faculty.first_name || ' ' || chair_faculty.last_name as dprc_chair_name
                FROM departments d
                LEFT JOIN users u ON d.id = u.department_id AND u.role = 'student' AND u.is_active = true
                LEFT JOIN faculty f ON d.id = f.department_id AND f.is_active = true
                LEFT JOIN dprc_committees dp ON d.id = dp.department_id AND dp.is_active = true
                LEFT JOIN faculty chair_faculty ON dp.chair_faculty_id = chair_faculty.id
                WHERE d.is_active = true
                GROUP BY d.id, dp.id, dp.committee_name, dp.formation_date, dp.chair_faculty_id, chair_faculty.first_name, chair_faculty.last_name
                ORDER BY d.dept_name
            `);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching departments:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching departments',
                error: error.message
            });
        }
    }

    // Add new department with faculty assignment
    static async addDepartment(req, res) {
        try {
            const { dept_code, dept_name, dept_full_name, faculty_members = [] } = req.body;

            if (!dept_code || !dept_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Department code and name are required'
                });
            }

            // Note: Allow department creation without faculty initially
            // Faculty can be added later through the edit interface

            // Start transaction
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Insert department
                const deptResult = await client.query(`
                    INSERT INTO departments (dept_code, dept_name, dept_full_name)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `, [dept_code, dept_name, dept_full_name]);

                const departmentId = deptResult.rows[0].id;

                // Assign faculty members to the department
                for (const faculty of faculty_members) {
                    await client.query(`
                        UPDATE faculty 
                        SET department_id = $1, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $2 AND is_active = true
                    `, [departmentId, faculty.id]);
                }

                await client.query('COMMIT');

                res.status(201).json({
                    success: true,
                    message: 'Department created successfully with faculty assignments',
                    data: {
                        ...deptResult.rows[0],
                        faculty_assigned: faculty_members.length
                    }
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                return res.status(400).json({
                    success: false,
                    message: 'Department code already exists'
                });
            }

            console.error('Error adding department:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding department',
                error: error.message
            });
        }
    }

    // Update department with faculty management
    static async updateDepartment(req, res) {
        try {
            const { id } = req.params;
            const { dept_code, dept_name, dept_full_name, is_active, faculty_members } = req.body;

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Update department basic info
                const result = await client.query(`
                    UPDATE departments 
                    SET dept_code = COALESCE($1, dept_code),
                        dept_name = COALESCE($2, dept_name),
                        dept_full_name = COALESCE($3, dept_full_name),
                        is_active = COALESCE($4, is_active),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $5
                    RETURNING *
                `, [dept_code, dept_name, dept_full_name, is_active, id]);

                if (result.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'Department not found'
                    });
                }

                // Update faculty assignments if provided
                if (faculty_members && Array.isArray(faculty_members)) {
                    // First, remove department assignment from faculty not in the new list
                    await client.query(`
                        UPDATE faculty 
                        SET department_id = NULL, updated_at = CURRENT_TIMESTAMP
                        WHERE department_id = $1 
                        AND id NOT IN (${faculty_members.map((_, i) => `$${i + 2}`).join(',') || 'NULL'})
                    `, [id, ...faculty_members.map(f => f.id)]);

                    // Then assign the selected faculty to this department
                    for (const faculty of faculty_members) {
                        await client.query(`
                            UPDATE faculty 
                            SET department_id = $1, updated_at = CURRENT_TIMESTAMP
                            WHERE id = $2 AND is_active = true
                        `, [id, faculty.id]);
                    }
                }

                await client.query('COMMIT');

                res.json({
                    success: true,
                    message: 'Department updated successfully',
                    data: result.rows[0]
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error updating department:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating department',
                error: error.message
            });
        }
    }

    // Update DPRC for existing department
    static async updateDepartmentDPRC(req, res) {
        try {
            const { departmentId } = req.params;
            const { committee_name, chair_faculty_id, members, meeting_schedule } = req.body;

            if (!committee_name || !chair_faculty_id || !members || members.length < 4) {
                return res.status(400).json({
                    success: false,
                    message: 'Committee name, chair, and at least 4 members are required'
                });
            }

            // Check if department exists and has enough faculty
            const deptCheck = await pool.query(`
                SELECT 
                    d.id,
                    d.dept_name,
                    COUNT(f.id) as faculty_count
                FROM departments d
                LEFT JOIN faculty f ON d.id = f.department_id AND f.is_active = true
                WHERE d.id = $1 AND d.is_active = true
                GROUP BY d.id, d.dept_name
            `, [departmentId]);

            if (deptCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Department not found'
                });
            }

            if (deptCheck.rows[0].faculty_count < 4) {
                return res.status(400).json({
                    success: false,
                    message: 'Department must have at least 4 faculty members to form DPRC'
                });
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Check if DPRC already exists for this department
                const existingDPRC = await client.query(`
                    SELECT id FROM dprc_committees 
                    WHERE department_id = $1 AND is_active = true
                `, [departmentId]);

                let dprcId;

                if (existingDPRC.rows.length > 0) {
                    // Update existing DPRC
                    dprcId = existingDPRC.rows[0].id;
                    
                    await client.query(`
                        UPDATE dprc_committees 
                        SET committee_name = $1,
                            chair_faculty_id = $2,
                            members = $3,
                            meeting_schedule = $4,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $5
                    `, [committee_name, chair_faculty_id, JSON.stringify(members), meeting_schedule, dprcId]);

                    // Deactivate old member assignments
                    await client.query(`
                        UPDATE dprc_member_assignments 
                        SET is_active = false
                        WHERE dprc_committee_id = $1
                    `, [dprcId]);

                } else {
                    // Create new DPRC
                    const dprcResult = await client.query(`
                        INSERT INTO dprc_committees (
                            department_id, committee_name, chair_faculty_id, members, 
                            meeting_schedule, formed_by
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING id
                    `, [departmentId, committee_name, chair_faculty_id, JSON.stringify(members), meeting_schedule, req.user.id]);
                    
                    dprcId = dprcResult.rows[0].id;
                }

                // Add new member assignments
                // Assign chair
                await client.query(`
                    INSERT INTO dprc_member_assignments (
                        dprc_committee_id, faculty_id, role_in_committee, assigned_by
                    ) VALUES ($1, $2, 'chair', $3)
                `, [dprcId, chair_faculty_id, req.user.id]);

                // Assign members
                for (const member of members) {
                    if (member.faculty_id !== chair_faculty_id) {
                        await client.query(`
                            INSERT INTO dprc_member_assignments (
                                dprc_committee_id, faculty_id, role_in_committee, assigned_by
                            ) VALUES ($1, $2, $3, $4)
                        `, [dprcId, member.faculty_id, member.role || 'member', req.user.id]);
                    }
                }

                // Update faculty roles - First deactivate old DPRC roles for this department
                await client.query(`
                    UPDATE faculty_roles 
                    SET is_active = false 
                    WHERE department_id = $1 AND role IN ('dprc_chair', 'dprc_member')
                `, [departmentId]);

                // Add chair role
                await client.query(`
                    INSERT INTO faculty_roles (faculty_id, role, department_id, assigned_by, is_active)
                    VALUES ($1, 'dprc_chair', $2, $3, true)
                `, [chair_faculty_id, departmentId, req.user.id]);

                // Add member roles
                for (const member of members) {
                    if (member.faculty_id !== chair_faculty_id) {
                        await client.query(`
                            INSERT INTO faculty_roles (faculty_id, role, department_id, assigned_by, is_active)
                            VALUES ($1, 'dprc_member', $2, $3, true)
                        `, [member.faculty_id, departmentId, req.user.id]);
                    }
                }

                await client.query('COMMIT');

                res.json({
                    success: true,
                    message: 'DPRC updated successfully',
                    data: { dprc_id: dprcId, department_id: departmentId }
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error updating department DPRC:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating department DPRC',
                error: error.message
            });
        }
    }

    // Delete department
    static async deleteDepartment(req, res) {
        try {
            const { id } = req.params;

            // Check if department has active students or faculty
            const dependencyCheck = await pool.query(`
                SELECT 
                    COUNT(DISTINCT u.id) as student_count,
                    COUNT(DISTINCT f.id) as faculty_count
                FROM departments d
                LEFT JOIN users u ON d.id = u.department_id AND u.role = 'student' AND u.is_active = true
                LEFT JOIN faculty f ON d.id = f.department_id AND f.is_active = true
                WHERE d.id = $1
                GROUP BY d.id
            `, [id]);

            if (dependencyCheck.rows.length > 0) {
                const { student_count, faculty_count } = dependencyCheck.rows[0];
                if (student_count > 0 || faculty_count > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot delete department. It has ${student_count} active students and ${faculty_count} active faculty members.`
                    });
                }
            }

            const result = await pool.query(`
                UPDATE departments 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Department not found'
                });
            }

            res.json({
                success: true,
                message: 'Department deactivated successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error deleting department:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting department',
                error: error.message
            });
        }
    }

    // Get department details with faculty and DPRC info
    static async getDepartmentDetails(req, res) {
        try {
            const { id } = req.params;

            const result = await pool.query(`
                SELECT * FROM department_management_view WHERE id = $1
            `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Department not found'
                });
            }

            // Get faculty members
            const facultyResult = await pool.query(`
                SELECT 
                    f.*,
                    CASE 
                        WHEN dma.role_in_committee = 'chair' THEN true
                        ELSE false
                    END as is_dprc_chair,
                    dma.role_in_committee as dprc_role
                FROM faculty f
                LEFT JOIN dprc_member_assignments dma ON f.id = dma.faculty_id AND dma.is_active = true
                LEFT JOIN dprc_committees dp ON dma.dprc_committee_id = dp.id AND dp.department_id = $1
                WHERE f.department_id = $1 AND f.is_active = true
                ORDER BY f.last_name, f.first_name
            `, [id]);

            res.json({
                success: true,
                data: {
                    ...result.rows[0],
                    faculty_members: facultyResult.rows
                }
            });

        } catch (error) {
            console.error('Error fetching department details:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching department details',
                error: error.message
            });
        }
    }

    // DPRC Management Functions
    
    // Create DPRC for a department
    static async createDPRC(req, res) {
        try {
            const { department_id, committee_name, chair_faculty_id, members, meeting_schedule } = req.body;

            if (!department_id || !committee_name || !chair_faculty_id || !members || members.length < 4) {
                return res.status(400).json({
                    success: false,
                    message: 'Department ID, committee name, chair, and at least 4 members are required'
                });
            }

            // Check if department can form DPRC
            const canFormResult = await pool.query('SELECT can_form_dprc($1) as can_form', [department_id]);
            if (!canFormResult.rows[0].can_form) {
                return res.status(400).json({
                    success: false,
                    message: 'Department does not have enough faculty members to form DPRC (minimum 4 required)'
                });
            }

            // Check if DPRC already exists for this department
            const existingDPRC = await pool.query(`
                SELECT id FROM dprc_committees 
                WHERE department_id = $1 AND is_active = true
            `, [department_id]);

            if (existingDPRC.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'DPRC already exists for this department'
                });
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Create DPRC committee
                const dprcResult = await client.query(`
                    INSERT INTO dprc_committees (
                        department_id, committee_name, chair_faculty_id, members, 
                        meeting_schedule, formed_by
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `, [department_id, committee_name, chair_faculty_id, JSON.stringify(members), meeting_schedule, req.user.id]);

                const dprcId = dprcResult.rows[0].id;

                // Assign chair
                await client.query(`
                    INSERT INTO dprc_member_assignments (
                        dprc_committee_id, faculty_id, role_in_committee, assigned_by
                    ) VALUES ($1, $2, 'chair', $3)
                `, [dprcId, chair_faculty_id, req.user.id]);

                // Assign members
                for (const member of members) {
                    if (member.faculty_id !== chair_faculty_id) {
                        await client.query(`
                            INSERT INTO dprc_member_assignments (
                                dprc_committee_id, faculty_id, role_in_committee, assigned_by
                            ) VALUES ($1, $2, $3, $4)
                        `, [dprcId, member.faculty_id, member.role || 'member', req.user.id]);
                    }
                }

                // Update faculty roles
                await client.query(`
                    INSERT INTO faculty_roles (faculty_id, role, department_id, assigned_by)
                    VALUES ($1, 'dprc_chair', $2, $3)
                `, [chair_faculty_id, department_id, req.user.id]);

                for (const member of members) {
                    if (member.faculty_id !== chair_faculty_id) {
                        await client.query(`
                            INSERT INTO faculty_roles (faculty_id, role, department_id, assigned_by)
                            VALUES ($1, 'dprc_member', $2, $3)
                        `, [member.faculty_id, department_id, req.user.id]);
                    }
                }

                await client.query('COMMIT');

                res.status(201).json({
                    success: true,
                    message: 'DPRC created successfully',
                    data: dprcResult.rows[0]
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error creating DPRC:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating DPRC',
                error: error.message
            });
        }
    }

    // Get DPRC details
    static async getDPRCDetails(req, res) {
        try {
            const { id } = req.params;

            const result = await pool.query(`
                SELECT 
                    dp.*,
                    d.dept_name,
                    f.first_name || ' ' || f.last_name as chair_name,
                    f.email as chair_email
                FROM dprc_committees dp
                JOIN departments d ON dp.department_id = d.id
                JOIN faculty f ON dp.chair_faculty_id = f.id
                WHERE dp.id = $1
            `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'DPRC not found'
                });
            }

            // Get committee members
            const membersResult = await pool.query(`
                SELECT 
                    dma.*,
                    f.first_name || ' ' || f.last_name as member_name,
                    f.email as member_email,
                    f.designation,
                    f.research_interests
                FROM dprc_member_assignments dma
                JOIN faculty f ON dma.faculty_id = f.id
                WHERE dma.dprc_committee_id = $1 AND dma.is_active = true
                ORDER BY 
                    CASE dma.role_in_committee 
                        WHEN 'chair' THEN 1 
                        WHEN 'secretary' THEN 2 
                        ELSE 3 
                    END,
                    f.last_name
            `, [id]);

            res.json({
                success: true,
                data: {
                    ...result.rows[0],
                    committee_members: membersResult.rows
                }
            });

        } catch (error) {
            console.error('Error fetching DPRC details:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching DPRC details',
                error: error.message
            });
        }
    }

    // Update DPRC
    static async updateDPRC(req, res) {
        try {
            const { id } = req.params;
            const { committee_name, chair_faculty_id, members, meeting_schedule, is_active } = req.body;

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Update DPRC committee
                const result = await client.query(`
                    UPDATE dprc_committees 
                    SET committee_name = COALESCE($1, committee_name),
                        chair_faculty_id = COALESCE($2, chair_faculty_id),
                        members = COALESCE($3, members),
                        meeting_schedule = COALESCE($4, meeting_schedule),
                        is_active = COALESCE($5, is_active),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $6
                    RETURNING *
                `, [committee_name, chair_faculty_id, members ? JSON.stringify(members) : null, 
                    meeting_schedule, is_active, id]);

                if (result.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'DPRC not found'
                    });
                }

                // If members are updated, update assignments
                if (members) {
                    // Deactivate old assignments
                    await client.query(`
                        UPDATE dprc_member_assignments 
                        SET is_active = false
                        WHERE dprc_committee_id = $1
                    `, [id]);

                    // Add new assignments
                    if (chair_faculty_id) {
                        await client.query(`
                            INSERT INTO dprc_member_assignments (
                                dprc_committee_id, faculty_id, role_in_committee, assigned_by
                            ) VALUES ($1, $2, 'chair', $3)
                            ON CONFLICT (dprc_committee_id, faculty_id, is_active) 
                            DO UPDATE SET is_active = true, role_in_committee = 'chair'
                        `, [id, chair_faculty_id, req.user.id]);
                    }

                    for (const member of members) {
                        if (member.faculty_id !== chair_faculty_id) {
                            await client.query(`
                                INSERT INTO dprc_member_assignments (
                                    dprc_committee_id, faculty_id, role_in_committee, assigned_by
                                ) VALUES ($1, $2, $3, $4)
                                ON CONFLICT (dprc_committee_id, faculty_id, is_active) 
                                DO UPDATE SET is_active = true, role_in_committee = $3
                            `, [id, member.faculty_id, member.role || 'member', req.user.id]);
                        }
                    }
                }

                await client.query('COMMIT');

                res.json({
                    success: true,
                    message: 'DPRC updated successfully',
                    data: result.rows[0]
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error updating DPRC:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating DPRC',
                error: error.message
            });
        }
    }

    // Get all DPRCs
    static async getAllDPRCs(req, res) {
        try {
            const result = await pool.query(`
                SELECT 
                    dp.*,
                    d.dept_name,
                    d.dept_code,
                    f.first_name || ' ' || f.last_name as chair_name,
                    COUNT(dma.id) as member_count
                FROM dprc_committees dp
                JOIN departments d ON dp.department_id = d.id
                JOIN faculty f ON dp.chair_faculty_id = f.id
                LEFT JOIN dprc_member_assignments dma ON dp.id = dma.dprc_committee_id AND dma.is_active = true
                WHERE dp.is_active = true
                GROUP BY dp.id, d.dept_name, d.dept_code, f.first_name, f.last_name
                ORDER BY d.dept_name
            `);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching DPRCs:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching DPRCs',
                error: error.message
            });
        }
    }

    // Get faculty available for DPRC assignment
    static async getAvailableFaculty(req, res) {
        try {
            const { department_id } = req.query;

            let whereClause = 'WHERE f.is_active = true AND f.can_supervise = true';
            const params = [];

            if (department_id) {
                whereClause += ' AND f.department_id = $1';
                params.push(department_id);
            }

            const result = await pool.query(`
                SELECT 
                    f.*,
                    d.dept_name,
                    CASE 
                        WHEN dma.id IS NOT NULL THEN true 
                        ELSE false 
                    END as is_dprc_member,
                    dma.role_in_committee as current_dprc_role
                FROM faculty f
                LEFT JOIN departments d ON f.department_id = d.id
                LEFT JOIN dprc_member_assignments dma ON f.id = dma.faculty_id AND dma.is_active = true
                ${whereClause}
                ORDER BY f.last_name, f.first_name
            `, params);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching available faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching available faculty',
                error: error.message
            });
        }
    }

    // Get comprehensive progress report
    static async getProgressReport(req, res) {
        try {
            const { department, semester, academic_year } = req.query;

            let whereClause = "WHERE u.role = 'student' AND u.is_active = true";
            const params = [];
            let paramCount = 0;

            if (department) {
                paramCount++;
                whereClause += ` AND u.department_id = $${paramCount}`;
                params.push(department);
            }

            if (semester) {
                paramCount++;
                whereClause += ` AND u.current_semester = $${paramCount}`;
                params.push(semester);
            }

            if (academic_year) {
                paramCount++;
                whereClause += ` AND u.academic_year = $${paramCount}`;
                params.push(academic_year);
            }

            const query = `
                SELECT 
                    d.dept_name,
                    u.current_semester,
                    swp.current_stage,
                    COUNT(*) as student_count,
                    AVG(swp.total_forms_submitted) as avg_forms_submitted,
                    AVG(swp.total_forms_approved) as avg_forms_approved,
                    COUNT(CASE WHEN swp.has_pending_actions THEN 1 END) as students_with_pending_actions
                FROM users u
                JOIN departments d ON u.department_id = d.id
                LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
                ${whereClause}
                GROUP BY d.dept_name, u.current_semester, swp.current_stage
                ORDER BY d.dept_name, u.current_semester, swp.current_stage
            `;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error generating progress report:', error);
            res.status(500).json({
                success: false,
                message: 'Error generating progress report',
                error: error.message
            });
        }
    }

    // Update student semester status
    static async updateStudentSemester(req, res) {
        try {
            const { student_id, current_semester, academic_year } = req.body;

            if (!student_id || !current_semester) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID and current semester are required'
                });
            }

            // Update user record
            const userResult = await pool.query(`
                UPDATE users 
                SET current_semester = $1, academic_year = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3 AND role = 'student'
                RETURNING id, first_name, last_name, student_id
            `, [current_semester, academic_year, student_id]);

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Update workflow progress
            await pool.query(`
                UPDATE student_workflow_progress 
                SET current_semester = $1, academic_year = $2, updated_at = CURRENT_TIMESTAMP
                WHERE student_id = $3
            `, [current_semester, academic_year, student_id]);

            res.json({
                success: true,
                message: 'Student semester updated successfully',
                data: userResult.rows[0]
            });

        } catch (error) {
            console.error('Error updating student semester:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating student semester',
                error: error.message
            });
        }
    }

    // Form submission approval functions
    static async approveFormSubmission(req, res) {
        try {
            const { submissionId } = req.params;
            const { approval_comments } = req.body;

            const result = await pool.query(`
                UPDATE form_submissions 
                SET final_approval_status = 'approved', 
                    approved_by = $1,
                    approval_comments = $2,
                    approved_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `, [req.user.id, approval_comments, submissionId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Form submission not found'
                });
            }

            res.json({
                success: true,
                message: 'Form submission approved successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error approving form submission:', error);
            res.status(500).json({
                success: false,
                message: 'Error approving form submission',
                error: error.message
            });
        }
    }

    static async rejectFormSubmission(req, res) {
        try {
            const { submissionId } = req.params;
            const { rejection_reason } = req.body;

            const result = await pool.query(`
                UPDATE form_submissions 
                SET final_approval_status = 'rejected',
                    rejected_by = $1,
                    rejection_reason = $2,
                    rejected_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `, [req.user.id, rejection_reason, submissionId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Form submission not found'
                });
            }

            res.json({
                success: true,
                message: 'Form submission rejected',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error rejecting form submission:', error);
            res.status(500).json({
                success: false,
                message: 'Error rejecting form submission',
                error: error.message
            });
        }
    }

    static async deleteFormSubmission(req, res) {
        try {
            const { submissionId } = req.params;

            const result = await pool.query(`
                DELETE FROM form_submissions 
                WHERE id = $1
                RETURNING id
            `, [submissionId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Form submission not found'
                });
            }

            res.json({
                success: true,
                message: 'Form submission deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting form submission:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting form submission',
                error: error.message
            });
        }
    }

    // Comprehensive exam functions
    static async getComprehensiveExams(req, res) {
        try {
            const result = await pool.query(`
                SELECT 
                    ce.*,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    d.dept_name
                FROM comprehensive_exams ce
                LEFT JOIN users u ON ce.student_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                ORDER BY ce.created_at DESC
            `);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching comprehensive exams:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching comprehensive exams',
                error: error.message
            });
        }
    }

    static async getExamDetails(req, res) {
        try {
            const { examId } = req.params;

            const result = await pool.query(`
                SELECT 
                    ce.*,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    u.email as student_email,
                    d.dept_name
                FROM comprehensive_exams ce
                LEFT JOIN users u ON ce.student_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE ce.id = $1
            `, [examId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Exam not found'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error fetching exam details:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching exam details',
                error: error.message
            });
        }
    }

    static async scheduleExam(req, res) {
        try {
            const { examId } = req.params;
            const { exam_date, exam_time, location, committee_members } = req.body;

            const result = await pool.query(`
                UPDATE comprehensive_exams 
                SET exam_date = $1, 
                    exam_time = $2, 
                    location = $3, 
                    committee_members = $4,
                    status = 'scheduled',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING *
            `, [exam_date, exam_time, location, committee_members, examId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Exam not found'
                });
            }

            res.json({
                success: true,
                message: 'Exam scheduled successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error scheduling exam:', error);
            res.status(500).json({
                success: false,
                message: 'Error scheduling exam',
                error: error.message
            });
        }
    }

    static async updateExamResult(req, res) {
        try {
            const { examId } = req.params;
            const { result, grade, comments } = req.body;

            const updateResult = await pool.query(`
                UPDATE comprehensive_exams 
                SET result = $1, 
                    grade = $2, 
                    comments = $3,
                    status = 'completed',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING *
            `, [result, grade, comments, examId]);

            if (updateResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Exam not found'
                });
            }

            res.json({
                success: true,
                message: 'Exam result updated successfully',
                data: updateResult.rows[0]
            });

        } catch (error) {
            console.error('Error updating exam result:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating exam result',
                error: error.message
            });
        }
    }

    // Thesis defense functions
    static async getThesisDefenses(req, res) {
        try {
            const result = await pool.query(`
                SELECT 
                    td.*,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    d.dept_name
                FROM thesis_defenses td
                LEFT JOIN users u ON td.student_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                ORDER BY td.created_at DESC
            `);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching thesis defenses:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching thesis defenses',
                error: error.message
            });
        }
    }

    static async getDefenseDetails(req, res) {
        try {
            const { defenseId } = req.params;

            const result = await pool.query(`
                SELECT 
                    td.*,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    u.email as student_email,
                    d.dept_name
                FROM thesis_defenses td
                LEFT JOIN users u ON td.student_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE td.id = $1
            `, [defenseId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Defense not found'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error fetching defense details:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching defense details',
                error: error.message
            });
        }
    }

    static async scheduleDefense(req, res) {
        try {
            const { defenseId } = req.params;
            const { defense_date, defense_time, location, committee_members } = req.body;

            const result = await pool.query(`
                UPDATE thesis_defenses 
                SET defense_date = $1, 
                    defense_time = $2, 
                    location = $3, 
                    committee_members = $4,
                    status = 'scheduled',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING *
            `, [defense_date, defense_time, location, committee_members, defenseId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Defense not found'
                });
            }

            res.json({
                success: true,
                message: 'Defense scheduled successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error scheduling defense:', error);
            res.status(500).json({
                success: false,
                message: 'Error scheduling defense',
                error: error.message
            });
        }
    }

    static async updateDefenseResult(req, res) {
        try {
            const { defenseId } = req.params;
            const { result, grade, comments } = req.body;

            const updateResult = await pool.query(`
                UPDATE thesis_defenses 
                SET result = $1, 
                    grade = $2, 
                    comments = $3,
                    status = 'completed',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING *
            `, [result, grade, comments, defenseId]);

            if (updateResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Defense not found'
                });
            }

            res.json({
                success: true,
                message: 'Defense result updated successfully',
                data: updateResult.rows[0]
            });

        } catch (error) {
            console.error('Error updating defense result:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating defense result',
                error: error.message
            });
        }
    }

    // Statistics and reporting
    static async getDetailedStatistics(req, res) {
        try {
            const stats = await pool.query(`
                SELECT 
                    'total_students' as metric,
                    COUNT(*) as value
                FROM users WHERE role = 'student' AND is_active = true
                UNION ALL
                SELECT 
                    'total_faculty' as metric,
                    COUNT(*) as value
                FROM faculty WHERE is_active = true
                UNION ALL
                SELECT 
                    'total_submissions' as metric,
                    COUNT(*) as value
                FROM form_submissions
                UNION ALL
                SELECT 
                    'pending_approvals' as metric,
                    COUNT(*) as value
                FROM form_submissions 
                WHERE final_approval_status = 'pending'
            `);

            res.json({
                success: true,
                data: stats.rows
            });

        } catch (error) {
            console.error('Error fetching detailed statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching detailed statistics',
                error: error.message
            });
        }
    }

    // Approval management
    static async getPendingApprovals(req, res) {
        try {
            const result = await pool.query(`
                SELECT 
                    fs.id,
                    fs.submitted_at,
                    ft.form_name,
                    ft.form_code,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    d.dept_name,
                    CASE 
                        WHEN fs.dec_approval_status = 'pending' THEN 'dec_approval'
                        WHEN fs.dprc_approval_status = 'pending' THEN 'dprc_approval'
                        WHEN fs.supervisor_approval_status = 'pending' THEN 'supervisor_approval'
                        WHEN fs.gec_approval_status = 'pending' THEN 'gec_approval'
                        WHEN fs.hod_approval_status = 'pending' THEN 'hod_approval'
                        WHEN fs.chairperson_approval_status = 'pending' THEN 'chairperson_approval'
                        ELSE 'pending'
                    END as approval_stage,
                    'pending' as status
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE (
                    fs.dec_approval_status = 'pending' OR
                    fs.dprc_approval_status = 'pending' OR
                    fs.supervisor_approval_status = 'pending' OR
                    fs.gec_approval_status = 'pending' OR
                    fs.hod_approval_status = 'pending' OR
                    fs.chairperson_approval_status = 'pending'
                )
                ORDER BY fs.submitted_at ASC
            `);

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

    static async processApproval(req, res) {
        try {
            const { approvalId } = req.params;
            const { action, comments, approvalStage = 'dec' } = req.body; // action: 'approve' or 'reject'

            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Must be "approve" or "reject"'
                });
            }

            const status = action === 'approve' ? 'approved' : 'rejected';
            
            // Determine which approval field to update based on approval stage
            let approvalField, approverField, timestampField, commentsField;
            
            switch (approvalStage) {
                case 'dec':
                    approvalField = 'dec_approval_status';
                    approverField = 'dec_approved_by';
                    timestampField = 'dec_approved_at';
                    commentsField = 'dec_comments';
                    break;
                case 'dprc':
                    approvalField = 'dprc_approval_status';
                    approverField = 'dprc_approved_by';
                    timestampField = 'dprc_approved_at';
                    commentsField = 'dprc_comments';
                    break;
                case 'supervisor':
                    approvalField = 'supervisor_approval_status';
                    approverField = 'supervisor_approved_by';
                    timestampField = 'supervisor_approved_at';
                    commentsField = 'supervisor_comments';
                    break;
                case 'gec':
                    approvalField = 'gec_approval_status';
                    approverField = 'gec_approved_by';
                    timestampField = 'gec_approved_at';
                    commentsField = 'gec_comments';
                    break;
                case 'hod':
                    approvalField = 'hod_approval_status';
                    approverField = 'hod_approved_by';
                    timestampField = 'hod_approved_at';
                    commentsField = 'hod_comments';
                    break;
                case 'chairperson':
                    approvalField = 'chairperson_approval_status';
                    approverField = 'chairperson_approved_by';
                    timestampField = 'chairperson_approved_at';
                    commentsField = 'chairperson_comments';
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid approval stage'
                    });
            }

            const result = await pool.query(`
                UPDATE form_submissions 
                SET ${approvalField} = $1,
                    ${approverField} = $2,
                    ${commentsField} = $3,
                    ${timestampField} = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING *
            `, [status, req.user.id, comments, approvalId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Approval not found'
                });
            }

            // Check if all required approvals are complete
            const submission = result.rows[0];
            const formTypeQuery = `
                SELECT requires_dec_approval, requires_dprc_approval, requires_supervisor_approval, 
                       requires_gec_approval, requires_hod_approval, requires_chairperson_approval
                FROM form_types WHERE id = $1
            `;
            const formTypeResult = await pool.query(formTypeQuery, [submission.form_type_id]);
            
            if (formTypeResult.rows.length > 0) {
                const formType = formTypeResult.rows[0];
                let allApproved = true;
                
                if (formType.requires_dec_approval && submission.dec_approval_status !== 'approved') allApproved = false;
                if (formType.requires_dprc_approval && submission.dprc_approval_status !== 'approved') allApproved = false;
                if (formType.requires_supervisor_approval && submission.supervisor_approval_status !== 'approved') allApproved = false;
                if (formType.requires_gec_approval && submission.gec_approval_status !== 'approved') allApproved = false;
                if (formType.requires_hod_approval && submission.hod_approval_status !== 'approved') allApproved = false;
                if (formType.requires_chairperson_approval && submission.chairperson_approval_status !== 'approved') allApproved = false;
                
                if (allApproved) {
                    // Update final approval status
                    await pool.query(`
                        UPDATE form_submissions 
                        SET final_approval_status = 'approved', final_approved_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                    `, [approvalId]);
                }
            }

            res.json({
                success: true,
                message: `${approvalStage.toUpperCase()} approval ${action}d successfully`,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error processing approval:', error);
            res.status(500).json({
                success: false,
                message: 'Error processing approval',
                error: error.message
            });
        }
    }

    // System logs
    static async getSystemLogs(req, res) {
        try {
            const { page = 1, limit = 50, level, action } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = '';
            const params = [];
            let paramCount = 0;

            if (level) {
                paramCount++;
                whereClause += `WHERE level = $${paramCount}`;
                params.push(level);
            }

            if (action) {
                paramCount++;
                whereClause += `${whereClause ? ' AND' : 'WHERE'} action = $${paramCount}`;
                params.push(action);
            }

            const query = `
                SELECT 
                    sl.*,
                    u.first_name || ' ' || u.last_name as user_name,
                    u.email as user_email
                FROM system_logs sl
                LEFT JOIN users u ON sl.user_id = u.id
                ${whereClause}
                ORDER BY sl.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            params.push(limit, offset);
            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Error fetching system logs:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system logs',
                error: error.message
            });
        }
    }

    // User management
    static async getAllUsers(req, res) {
        try {
            const { page = 1, limit = 20, role, status, search } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = '';
            const params = [];
            let paramCount = 0;

            if (role) {
                paramCount++;
                whereClause += `WHERE u.role = $${paramCount}`;
                params.push(role);
            }

            if (status) {
                paramCount++;
                whereClause += `${whereClause ? ' AND' : 'WHERE'} u.is_active = $${paramCount}`;
                params.push(status === 'active');
            }

            if (search) {
                paramCount++;
                whereClause += `${whereClause ? ' AND' : 'WHERE'} (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.student_id ILIKE $${paramCount})`;
                params.push(`%${search}%`);
            }

            const query = `
                SELECT 
                    u.*,
                    d.dept_name
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                ${whereClause}
                ORDER BY u.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            params.push(limit, offset);
            const result = await pool.query(query, params);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) 
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
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
            console.error('Error fetching users:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching users',
                error: error.message
            });
        }
    }

    static async updateUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { is_active } = req.body;

            const result = await pool.query(`
                UPDATE users 
                SET is_active = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING id, first_name, last_name, email, is_active
            `, [is_active, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error updating user status:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating user status',
                error: error.message
            });
        }
    }

    // Get form submission details for viewing (Admin)
    static async getFormSubmissionDetails(req, res) {
        try {
            const { submissionId } = req.params;

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
}

module.exports = AdminController; 