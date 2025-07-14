const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const WorkflowService = require('../services/WorkflowService');
const NotificationService = require('../services/NotificationService');
const { authenticateToken } = require('../middleware/auth');

// Middleware to ensure admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Apply auth middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard routes
router.get('/dashboard/overview', AdminController.getDashboardOverview);
router.get('/dashboard/statistics', AdminController.getDetailedStatistics);
router.get('/dashboard/analytics', async (req, res) => {
    try {
        const analytics = await WorkflowService.getWorkflowAnalytics();
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching workflow analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
});

// Student management routes
router.get('/students', AdminController.getAllStudents);
router.get('/students/:studentId/workflow', async (req, res) => {
    try {
        const { studentId } = req.params;
        const workflowStatus = await WorkflowService.getStudentWorkflowStatus(parseInt(studentId));
        
        res.json({
            success: true,
            data: workflowStatus
        });
    } catch (error) {
        console.error('Error fetching student workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student workflow',
            error: error.message
        });
    }
});

router.post('/students/:studentId/advance-stage', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { currentStage } = req.body;
        const adminId = req.user.id;

        const updatedProgress = await WorkflowService.advanceStudentToNextStage(
            parseInt(studentId), 
            currentStage, 
            adminId
        );

        res.json({
            success: true,
            message: 'Student advanced to next stage successfully',
            data: updatedProgress
        });
    } catch (error) {
        console.error('Error advancing student stage:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

router.put('/students/:studentId/semester', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, academicYear } = req.body;

        const updatedProgress = await WorkflowService.updateStudentSemester(
            parseInt(studentId),
            semester,
            academicYear
        );

        res.json({
            success: true,
            message: 'Student semester updated successfully',
            data: updatedProgress
        });
    } catch (error) {
        console.error('Error updating student semester:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student semester',
            error: error.message
        });
    }
});

router.get('/students/requiring-attention', async (req, res) => {
    try {
        const { daysThreshold = 90 } = req.query;
        const students = await WorkflowService.getStudentsRequiringAttention(parseInt(daysThreshold));
        
        res.json({
            success: true,
            data: {
                students,
                threshold: daysThreshold
            }
        });
    } catch (error) {
        console.error('Error fetching students requiring attention:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students requiring attention',
            error: error.message
        });
    }
});

// User management routes
router.get('/users', AdminController.getAllUsers);
router.put('/users/:userId/status', AdminController.updateUserStatus);

// Form approval routes
router.get('/approvals', AdminController.getPendingApprovals);
router.put('/approvals/:submissionId', AdminController.updateFormApproval);

// System logs and audit trail
router.get('/logs', AdminController.getSystemLogs);

// Notification management routes
router.get('/notifications/stats', async (req, res) => {
    try {
        const stats = await NotificationService.getNotificationStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification stats',
            error: error.message
        });
    }
});

router.post('/notifications/send-announcement', async (req, res) => {
    try {
        const { title, message, targetRole, notificationType } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        const notifications = await NotificationService.sendSystemAnnouncement({
            title,
            message,
            targetRole,
            notificationType
        });

        res.json({
            success: true,
            message: 'Announcement sent successfully',
            data: {
                notificationCount: notifications.length
            }
        });
    } catch (error) {
        console.error('Error sending announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send announcement',
            error: error.message
        });
    }
});

router.post('/notifications/send-reminders', async (req, res) => {
    try {
        const reminderStats = await NotificationService.sendReminderNotifications();
        
        res.json({
            success: true,
            message: 'Reminder notifications sent successfully',
            data: reminderStats
        });
    } catch (error) {
        console.error('Error sending reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reminders',
            error: error.message
        });
    }
});

router.post('/notifications/send-deadlines', async (req, res) => {
    try {
        const deadlineStats = await NotificationService.sendDeadlineNotifications();
        
        res.json({
            success: true,
            message: 'Deadline notifications sent successfully',
            data: deadlineStats
        });
    } catch (error) {
        console.error('Error sending deadline notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send deadline notifications',
            error: error.message
        });
    }
});

router.delete('/notifications/cleanup', async (req, res) => {
    try {
        const deletedCount = await NotificationService.cleanupOldNotifications();
        
        res.json({
            success: true,
            message: 'Old notifications cleaned up successfully',
            data: {
                deletedCount
            }
        });
    } catch (error) {
        console.error('Error cleaning up notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup notifications',
            error: error.message
        });
    }
});

// GEC management routes
router.get('/gec/committees', async (req, res) => {
    try {
        const { page = 1, limit = 20, studentId } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE gc.is_active = true';
        let queryParams = [];
        let paramCount = 0;

        if (studentId) {
            paramCount++;
            whereClause += ` AND gc.student_id = $${paramCount}`;
            queryParams.push(studentId);
        }

        const committeesQuery = `
            SELECT 
                gc.*,
                u.first_name || ' ' || u.last_name as student_name,
                u.student_id,
                u.email as student_email,
                COUNT(gcm.id) as member_count
            FROM gec_committees gc
            JOIN users u ON gc.student_id = u.id
            LEFT JOIN gec_committee_members gcm ON gc.id = gcm.committee_id
            ${whereClause}
            GROUP BY gc.id, u.first_name, u.last_name, u.student_id, u.email
            ORDER BY gc.committee_formed_date DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        queryParams.push(limit, offset);

        const committees = await req.app.locals.db.query(committeesQuery, queryParams);

        res.json({
            success: true,
            data: {
                committees: committees.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching GEC committees:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch GEC committees',
            error: error.message
        });
    }
});

router.get('/gec/committees/:committeeId/members', async (req, res) => {
    try {
        const { committeeId } = req.params;

        const membersQuery = `
            SELECT 
                gcm.*,
                CASE 
                    WHEN gcm.member_id IS NOT NULL THEN u.first_name || ' ' || u.last_name
                    ELSE gcm.member_name
                END as display_name,
                CASE 
                    WHEN gcm.member_id IS NOT NULL THEN u.email
                    ELSE gcm.member_email
                END as display_email
            FROM gec_committee_members gcm
            LEFT JOIN users u ON gcm.member_id = u.id
            WHERE gcm.committee_id = $1
            ORDER BY 
                CASE gcm.member_role
                    WHEN 'chairperson' THEN 1
                    WHEN 'supervisor' THEN 2
                    WHEN 'co_supervisor' THEN 3
                    WHEN 'internal_member' THEN 4
                    WHEN 'external_member' THEN 5
                    ELSE 6
                END
        `;

        const members = await req.app.locals.db.query(membersQuery, [committeeId]);

        res.json({
            success: true,
            data: {
                members: members.rows
            }
        });
    } catch (error) {
        console.error('Error fetching committee members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch committee members',
            error: error.message
        });
    }
});

// Comprehensive exam management
router.get('/exams/comprehensive', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        let queryParams = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            whereClause += ` AND ce.exam_status = $${paramCount}`;
            queryParams.push(status);
        }

        const examsQuery = `
            SELECT 
                ce.*,
                u.first_name || ' ' || u.last_name as student_name,
                u.student_id,
                u.email as student_email,
                gc.committee_formed_date
            FROM comprehensive_exams ce
            JOIN users u ON ce.student_id = u.id
            LEFT JOIN gec_committees gc ON ce.committee_id = gc.id
            ${whereClause}
            ORDER BY ce.exam_date DESC NULLS LAST, ce.created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        queryParams.push(limit, offset);

        const exams = await req.app.locals.db.query(examsQuery, queryParams);

        res.json({
            success: true,
            data: {
                exams: exams.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching comprehensive exams:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comprehensive exams',
            error: error.message
        });
    }
});

// Thesis defense management
router.get('/defenses', async (req, res) => {
    try {
        const { defenseType, status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        let queryParams = [];
        let paramCount = 0;

        if (defenseType) {
            paramCount++;
            whereClause += ` AND td.defense_type = $${paramCount}`;
            queryParams.push(defenseType);
        }

        if (status) {
            paramCount++;
            whereClause += ` AND td.defense_status = $${paramCount}`;
            queryParams.push(status);
        }

        const defensesQuery = `
            SELECT 
                td.*,
                u.first_name || ' ' || u.last_name as student_name,
                u.student_id,
                u.email as student_email
            FROM thesis_defenses td
            JOIN users u ON td.student_id = u.id
            ${whereClause}
            ORDER BY td.scheduled_date DESC NULLS LAST, td.created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        queryParams.push(limit, offset);

        const defenses = await req.app.locals.db.query(defensesQuery, queryParams);

        res.json({
            success: true,
            data: {
                defenses: defenses.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching thesis defenses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch thesis defenses',
            error: error.message
        });
    }
});

// System settings and configuration
router.get('/settings', async (req, res) => {
    try {
        // This could be expanded to include system-wide settings
        // For now, return basic configuration
        const settings = {
            workflowStages: WorkflowService.WORKFLOW_STAGES,
            stageRequirements: WorkflowService.STAGE_REQUIREMENTS,
            systemVersion: '1.0.0',
            maintenanceMode: false
        };

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings',
            error: error.message
        });
    }
});

module.exports = router; 