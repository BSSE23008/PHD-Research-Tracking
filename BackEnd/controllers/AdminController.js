const db = require('../config/database');
const NotificationService = require('../services/NotificationService');

class AdminController {
    // Dashboard Overview
    static async getDashboardOverview(req, res) {
        try {
            const overviewQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true) as total_students,
                    (SELECT COUNT(*) FROM users WHERE role = 'supervisor' AND is_active = true) as total_supervisors,
                    (SELECT COUNT(*) FROM form_submissions WHERE status = 'submitted' AND DATE(submitted_at) = CURRENT_DATE) as todays_submissions,
                    (SELECT COUNT(*) FROM form_submissions WHERE admin_approval_status = 'pending') as pending_approvals,
                    (SELECT COUNT(*) FROM comprehensive_exams WHERE exam_status = 'scheduled' AND exam_date >= CURRENT_DATE) as upcoming_exams,
                    (SELECT COUNT(*) FROM thesis_defenses WHERE defense_status = 'scheduled' AND scheduled_date >= CURRENT_DATE) as upcoming_defenses
            `;

            const result = await db.query(overviewQuery);
            const overview = result.rows[0];

            // Get recent activity
            const recentActivityQuery = `
                SELECT 
                    fs.id,
                    u.first_name || ' ' || u.last_name as student_name,
                    ft.form_name,
                    fs.status,
                    fs.submitted_at,
                    fs.admin_approval_status
                FROM form_submissions fs
                JOIN users u ON fs.user_id = u.id
                JOIN form_types ft ON fs.form_type_id = ft.id
                ORDER BY fs.submitted_at DESC
                LIMIT 10
            `;

            const recentActivity = await db.query(recentActivityQuery);

            // Get workflow stage distribution
            const stageDistributionQuery = `
                SELECT 
                    current_stage,
                    COUNT(*) as student_count
                FROM student_workflow_progress
                GROUP BY current_stage
                ORDER BY student_count DESC
            `;

            const stageDistribution = await db.query(stageDistributionQuery);

            res.json({
                success: true,
                data: {
                    overview,
                    recentActivity: recentActivity.rows,
                    stageDistribution: stageDistribution.rows
                }
            });

        } catch (error) {
            console.error('Error fetching dashboard overview:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard overview',
                error: error.message
            });
        }
    }

    // Get detailed statistics
    static async getDetailedStatistics(req, res) {
        try {
            const { timeframe = '30d' } = req.query;
            
            let dateFilter = '';
            switch(timeframe) {
                case '7d':
                    dateFilter = "AND submitted_at >= CURRENT_DATE - INTERVAL '7 days'";
                    break;
                case '30d':
                    dateFilter = "AND submitted_at >= CURRENT_DATE - INTERVAL '30 days'";
                    break;
                case '90d':
                    dateFilter = "AND submitted_at >= CURRENT_DATE - INTERVAL '90 days'";
                    break;
                case '1y':
                    dateFilter = "AND submitted_at >= CURRENT_DATE - INTERVAL '1 year'";
                    break;
            }

            // Form submissions over time
            const submissionsQuery = `
                SELECT 
                    DATE(submitted_at) as date,
                    COUNT(*) as submission_count,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count
                FROM form_submissions 
                WHERE 1=1 ${dateFilter}
                GROUP BY DATE(submitted_at)
                ORDER BY date DESC
            `;

            // Form types popularity
            const formTypesQuery = `
                SELECT 
                    ft.form_name,
                    ft.form_code,
                    COUNT(fs.id) as submission_count,
                    AVG(EXTRACT(EPOCH FROM (fs.approved_at - fs.submitted_at))/86400) as avg_approval_days
                FROM form_types ft
                LEFT JOIN form_submissions fs ON ft.id = fs.form_type_id ${dateFilter.replace('submitted_at', 'fs.submitted_at')}
                GROUP BY ft.id, ft.form_name, ft.form_code
                ORDER BY submission_count DESC
            `;

            // Student progress analytics
            const progressQuery = `
                SELECT 
                    swp.current_stage,
                    COUNT(*) as student_count,
                    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - swp.stage_start_date))/86400) as avg_days_in_stage
                FROM student_workflow_progress swp
                JOIN users u ON swp.student_id = u.id
                WHERE u.is_active = true
                GROUP BY swp.current_stage
            `;

            // Supervisor workload
            const supervisorQuery = `
                SELECT 
                    u.first_name || ' ' || u.last_name as supervisor_name,
                    u.email,
                    COUNT(DISTINCT scf.student_id) as current_students,
                    u.max_students,
                    (u.max_students - COUNT(DISTINCT scf.student_id)) as available_slots
                FROM users u
                LEFT JOIN supervisor_consent_forms scf ON u.id = scf.supervisor_id
                LEFT JOIN form_submissions fs ON scf.form_submission_id = fs.id
                WHERE u.role = 'supervisor' AND u.is_active = true
                    AND (fs.status = 'approved' OR fs.status IS NULL)
                GROUP BY u.id, u.first_name, u.last_name, u.email, u.max_students
                ORDER BY current_students DESC
            `;

            const [submissions, formTypes, progress, supervisors] = await Promise.all([
                db.query(submissionsQuery),
                db.query(formTypesQuery),
                db.query(progressQuery),
                db.query(supervisorQuery)
            ]);

            res.json({
                success: true,
                data: {
                    submissionsOverTime: submissions.rows,
                    formTypeStats: formTypes.rows,
                    studentProgress: progress.rows,
                    supervisorWorkload: supervisors.rows
                }
            });

        } catch (error) {
            console.error('Error fetching detailed statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch detailed statistics',
                error: error.message
            });
        }
    }

    // Get all students with their progress
    static async getAllStudents(req, res) {
        try {
            const { page = 1, limit = 20, stage, search } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = "WHERE u.role = 'student' AND u.is_active = true";
            let queryParams = [];
            let paramCount = 0;

            if (stage) {
                paramCount++;
                whereClause += ` AND swp.current_stage = $${paramCount}`;
                queryParams.push(stage);
            }

            if (search) {
                paramCount++;
                whereClause += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.student_id ILIKE $${paramCount})`;
                queryParams.push(`%${search}%`);
            }

            const studentsQuery = `
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.student_id,
                    u.enrollment_year,
                    u.research_area,
                    swp.current_stage,
                    swp.semester,
                    swp.academic_year,
                    swp.stage_start_date,
                    (SELECT supervisor_name FROM supervisor_consent_forms scf 
                     JOIN form_submissions fs ON scf.form_submission_id = fs.id 
                     WHERE fs.user_id = u.id AND fs.status = 'approved' LIMIT 1) as supervisor_name,
                    (SELECT COUNT(*) FROM form_submissions WHERE user_id = u.id AND status = 'approved') as completed_forms,
                    (SELECT COUNT(*) FROM form_submissions WHERE user_id = u.id AND admin_approval_status = 'pending') as pending_forms
                FROM users u
                LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
                ${whereClause}
                ORDER BY u.enrollment_year DESC, u.last_name
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            queryParams.push(limit, offset);

            const countQuery = `
                SELECT COUNT(*) as total
                FROM users u
                LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
                ${whereClause}
            `;

            const [students, count] = await Promise.all([
                db.query(studentsQuery, queryParams),
                db.query(countQuery, queryParams.slice(0, -2))
            ]);

            res.json({
                success: true,
                data: {
                    students: students.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: parseInt(count.rows[0].total),
                        pages: Math.ceil(count.rows[0].total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching students:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch students',
                error: error.message
            });
        }
    }

    // Get pending approvals
    static async getPendingApprovals(req, res) {
        try {
            const { type = 'all' } = req.query;

            let whereClause = "WHERE 1=1";
            if (type === 'admin') {
                whereClause += " AND fs.admin_approval_status = 'pending'";
            } else if (type === 'supervisor') {
                whereClause += " AND fs.supervisor_approval_status = 'pending'";
            } else if (type === 'gec') {
                whereClause += " AND fs.gec_approval_status = 'pending'";
            } else {
                whereClause += " AND (fs.admin_approval_status = 'pending' OR fs.supervisor_approval_status = 'pending' OR fs.gec_approval_status = 'pending')";
            }

            const approvalsQuery = `
                SELECT 
                    fs.id,
                    fs.status,
                    fs.submitted_at,
                    fs.admin_approval_status,
                    fs.supervisor_approval_status,
                    fs.gec_approval_status,
                    fs.form_data,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.email as student_email,
                    u.student_id,
                    ft.form_name,
                    ft.form_code,
                    ft.workflow_stage,
                    ft.requires_supervisor_approval,
                    ft.requires_admin_approval,
                    ft.requires_gec_approval
                FROM form_submissions fs
                JOIN users u ON fs.user_id = u.id
                JOIN form_types ft ON fs.form_type_id = ft.id
                ${whereClause}
                ORDER BY fs.submitted_at ASC
            `;

            const result = await db.query(approvalsQuery);

            res.json({
                success: true,
                data: {
                    pendingApprovals: result.rows
                }
            });

        } catch (error) {
            console.error('Error fetching pending approvals:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending approvals',
                error: error.message
            });
        }
    }

    // Approve/Reject form submission
    static async updateFormApproval(req, res) {
        try {
            const { submissionId } = req.params;
            const { action, comments, approvalType = 'admin' } = req.body;
            const adminId = req.user.id;

            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Must be "approve" or "reject"'
                });
            }

            const status = action === 'approve' ? 'approved' : 'rejected';
            let updateFields = '';
            let queryParams = [status, adminId, comments, submissionId];

            switch(approvalType) {
                case 'admin':
                    updateFields = `
                        admin_approval_status = $1,
                        admin_approved_by = $2,
                        admin_approved_at = CURRENT_TIMESTAMP,
                        admin_comments = $3
                    `;
                    break;
                case 'supervisor':
                    updateFields = `
                        supervisor_approval_status = $1,
                        supervisor_approved_by = $2,
                        supervisor_approved_at = CURRENT_TIMESTAMP,
                        supervisor_comments = $3
                    `;
                    break;
                case 'gec':
                    updateFields = `
                        gec_approval_status = $1,
                        gec_approved_by = $2,
                        gec_approved_at = CURRENT_TIMESTAMP,
                        gec_comments = $3
                    `;
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid approval type'
                    });
            }

            const updateQuery = `
                UPDATE form_submissions 
                SET ${updateFields},
                    reviewed_at = CURRENT_TIMESTAMP,
                    reviewed_by = $2,
                    status = CASE 
                        WHEN $1 = 'approved' AND admin_approval_status = 'approved' 
                             AND (supervisor_approval_status = 'approved' OR supervisor_approval_status = 'pending')
                             AND (gec_approval_status = 'approved' OR gec_approval_status = 'pending')
                        THEN 'approved'
                        WHEN $1 = 'rejected' THEN 'rejected'
                        ELSE 'under_review'
                    END
                WHERE id = $4
                RETURNING *, (SELECT form_code FROM form_types WHERE id = form_type_id) as form_code
            `;

            const result = await db.query(updateQuery, queryParams);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Form submission not found'
                });
            }

            const submission = result.rows[0];

            // Send notification to student
            await NotificationService.createNotification({
                userId: submission.user_id,
                title: `Form ${action === 'approve' ? 'Approved' : 'Rejected'}`,
                message: `Your ${submission.form_code} form has been ${action}d by ${approvalType}. ${comments ? 'Comments: ' + comments : ''}`,
                notificationType: action === 'approve' ? 'success' : 'warning',
                relatedFormId: submission.id,
                actionRequired: action === 'reject'
            });

            // If form is fully approved, update student workflow stage
            if (submission.status === 'approved') {
                // Logic to potentially advance student to next stage
                // This would depend on the specific form type and workflow rules
            }

            res.json({
                success: true,
                message: `Form ${action}d successfully`,
                data: submission
            });

        } catch (error) {
            console.error(`Error ${req.body.action}ing form:`, error);
            res.status(500).json({
                success: false,
                message: `Failed to ${req.body.action} form`,
                error: error.message
            });
        }
    }

    // User management
    static async getAllUsers(req, res) {
        try {
            const { role, page = 1, limit = 20, search } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = "WHERE 1=1";
            let queryParams = [];
            let paramCount = 0;

            if (role) {
                paramCount++;
                whereClause += ` AND role = $${paramCount}`;
                queryParams.push(role);
            }

            if (search) {
                paramCount++;
                whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
                queryParams.push(`%${search}%`);
            }

            const usersQuery = `
                SELECT 
                    id, first_name, last_name, email, role, 
                    student_id, enrollment_year, research_area,
                    title, department, institution,
                    is_active, created_at
                FROM users 
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            queryParams.push(limit, offset);

            const countQuery = `
                SELECT COUNT(*) as total
                FROM users 
                ${whereClause}
            `;

            const [users, count] = await Promise.all([
                db.query(usersQuery, queryParams),
                db.query(countQuery, queryParams.slice(0, -2))
            ]);

            res.json({
                success: true,
                data: {
                    users: users.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: parseInt(count.rows[0].total),
                        pages: Math.ceil(count.rows[0].total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users',
                error: error.message
            });
        }
    }

    // Update user status
    static async updateUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { isActive } = req.body;

            const updateQuery = `
                UPDATE users 
                SET is_active = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING id, first_name, last_name, email, role, is_active
            `;

            const result = await db.query(updateQuery, [isActive, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Send notification to user
            await NotificationService.createNotification({
                userId: parseInt(userId),
                title: `Account ${isActive ? 'Activated' : 'Deactivated'}`,
                message: `Your account has been ${isActive ? 'activated' : 'deactivated'} by an administrator.`,
                notificationType: isActive ? 'success' : 'warning'
            });

            res.json({
                success: true,
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error updating user status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user status',
                error: error.message
            });
        }
    }

    // Get system logs/audit trail
    static async getSystemLogs(req, res) {
        try {
            const { page = 1, limit = 50, type } = req.query;
            const offset = (page - 1) * limit;

            // This would typically be from a separate audit_logs table
            // For now, we'll use form_submissions as a proxy for activity
            let whereClause = "WHERE 1=1";
            let queryParams = [];
            let paramCount = 0;

            if (type) {
                paramCount++;
                whereClause += ` AND ft.workflow_stage = $${paramCount}`;
                queryParams.push(type);
            }

            const logsQuery = `
                SELECT 
                    fs.id,
                    fs.status,
                    fs.submitted_at as timestamp,
                    'form_submission' as action_type,
                    u.first_name || ' ' || u.last_name as user_name,
                    u.email,
                    ft.form_name as action_description,
                    fs.admin_approval_status,
                    (SELECT first_name || ' ' || last_name FROM users WHERE id = fs.reviewed_by) as reviewed_by_name
                FROM form_submissions fs
                JOIN users u ON fs.user_id = u.id
                JOIN form_types ft ON fs.form_type_id = ft.id
                ${whereClause}
                ORDER BY fs.submitted_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            queryParams.push(limit, offset);

            const result = await db.query(logsQuery, queryParams);

            res.json({
                success: true,
                data: {
                    logs: result.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit)
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching system logs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch system logs',
                error: error.message
            });
        }
    }
}

module.exports = AdminController; 