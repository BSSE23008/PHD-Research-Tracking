const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class AdminController {
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
            const { page = 1, limit = 20, department, semester, search } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = "WHERE u.role = 'student'";
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
            const facultyCheck = await pool.query(
                'SELECT id, max_phd_students, current_phd_students FROM faculty WHERE id = $1 AND is_active = true AND can_supervise = true',
                [supervisor_id]
            );

            if (facultyCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty not found or cannot supervise'
                });
            }

            const faculty = facultyCheck.rows[0];

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
            `, [supervisor_id, student_id]);

            // Update faculty supervision count if primary supervisor
            if (supervisor_type === 'primary') {
                await pool.query(
                    'UPDATE faculty SET current_phd_students = current_phd_students + 1 WHERE id = $1',
                    [supervisor_id]
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

    // Get all departments
    static async getDepartments(req, res) {
        try {
            const result = await pool.query(`
                SELECT 
                    d.*,
                    COUNT(DISTINCT u.id) as total_students,
                    COUNT(DISTINCT f.id) as total_faculty
                FROM departments d
                LEFT JOIN users u ON d.id = u.department_id AND u.role = 'student' AND u.is_active = true
                LEFT JOIN faculty f ON d.id = f.department_id AND f.is_active = true
                WHERE d.is_active = true
                GROUP BY d.id
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

    // Add new department
    static async addDepartment(req, res) {
        try {
            const { dept_code, dept_name, dept_full_name } = req.body;

            if (!dept_code || !dept_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Department code and name are required'
                });
            }

            const result = await pool.query(`
                INSERT INTO departments (dept_code, dept_name, dept_full_name)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [dept_code, dept_name, dept_full_name]);

            res.status(201).json({
                success: true,
                message: 'Department added successfully',
                data: result.rows[0]
            });

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
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    d.dept_name,
                    'pending' as status
                FROM form_submissions fs
                JOIN form_types ft ON fs.form_type_id = ft.id
                JOIN users u ON fs.user_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE fs.final_approval_status = 'pending'
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
            const { action, comments } = req.body; // action: 'approve' or 'reject'

            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Must be "approve" or "reject"'
                });
            }

            const status = action === 'approve' ? 'approved' : 'rejected';
            const field = action === 'approve' ? 'approved_by' : 'rejected_by';
            const timestampField = action === 'approve' ? 'approved_at' : 'rejected_at';
            const commentsField = action === 'approve' ? 'approval_comments' : 'rejection_reason';

            const result = await pool.query(`
                UPDATE form_submissions 
                SET final_approval_status = $1,
                    ${field} = $2,
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

            res.json({
                success: true,
                message: `Approval ${action}d successfully`,
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
}

module.exports = AdminController; 