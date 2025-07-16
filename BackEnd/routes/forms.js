const express = require('express');
const router = express.Router();
const FormController = require('../controllers/FormController');
const WorkflowService = require('../services/WorkflowService');
const NotificationService = require('../services/NotificationService');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/attachments/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG, and TXT files are allowed'));
        }
    }
});

// Apply authentication to all routes
router.use(authenticateToken);

// Form type management routes
router.get('/types', FormController.getFormTypes);
router.get('/available', FormController.getAvailableForms);
router.get('/schema/:formCode', FormController.getFormSchema);

// Form progress routes (auto-save functionality)
router.post('/progress', FormController.saveProgress);
router.get('/progress/:formCode', FormController.loadProgress);

// Form submission routes
router.post('/submit', FormController.submitForm);
router.get('/submissions', FormController.getSubmissions);
router.get('/submissions/:submissionId', FormController.getSubmissionById);

// File attachment routes
router.post('/submissions/:submissionId/attachments', upload.single('file'), FormController.uploadAttachment);

// Workflow-related routes
router.get('/workflow/status', async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can access workflow status'
            });
        }

        const workflowStatus = await WorkflowService.getStudentWorkflowStatus(userId);
        
        res.json({
            success: true,
            data: workflowStatus
        });
    } catch (error) {
        console.error('Error fetching workflow status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflow status',
            error: error.message
        });
    }
});

router.put('/workflow/semester', async (req, res) => {
    try {
        const userId = req.user.id;
        const { semester, academicYear } = req.body;
        
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can update semester information'
            });
        }

        if (!semester || !academicYear) {
            return res.status(400).json({
                success: false,
                message: 'Semester and academic year are required'
            });
        }

        const updatedProgress = await WorkflowService.updateStudentSemester(userId, semester, academicYear);
        
        res.json({
            success: true,
            message: 'Semester information updated successfully',
            data: updatedProgress
        });
    } catch (error) {
        console.error('Error updating semester:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update semester information',
            error: error.message
        });
    }
});

// Notification routes for forms
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user.id;
        const { isRead, notificationType, page, limit } = req.query;
        
        const notifications = await NotificationService.getUserNotifications(userId, {
            isRead: isRead !== undefined ? isRead === 'true' : null,
            notificationType,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
        });
        
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

router.put('/notifications/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const notification = await NotificationService.markAsRead(parseInt(notificationId), userId);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
});

router.put('/notifications/mark-all-read', async (req, res) => {
    try {
        const userId = req.user.id;
        
        const updatedCount = await NotificationService.markAllAsRead(userId);
        
        res.json({
            success: true,
            message: 'All notifications marked as read',
            data: {
                updatedCount
            }
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
});

router.delete('/notifications/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const deleted = await NotificationService.deleteNotification(parseInt(notificationId), userId);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
});

router.get('/notifications/unread-count', async (req, res) => {
    try {
        const userId = req.user.id;
        
        const unreadCount = await NotificationService.getUnreadCount(userId);
        
        res.json({
            success: true,
            data: {
                unreadCount
            }
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
            error: error.message
        });
    }
});

// Form analytics (for admins and supervisors)
router.get('/analytics', async (req, res) => {
    try {
        if (!['admin', 'supervisor'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin or supervisor access required'
            });
        }

        await FormController.getFormAnalytics(req, res);
    } catch (error) {
        console.error('Error in analytics route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
});

// Supervisor-specific routes
router.get('/supervisor/pending-approvals', async (req, res) => {
    try {
        if (req.user.role !== 'supervisor') {
            return res.status(403).json({
                success: false,
                message: 'Supervisor access required'
            });
        }

        const supervisorId = req.user.id;
        
        // Get pending approvals for this supervisor's students
        const pendingQuery = `
            SELECT 
                fs.id,
                fs.status,
                fs.submitted_at,
                fs.supervisor_approval_status,
                fs.form_data,
                u.first_name || ' ' || u.last_name as student_name,
                u.email as student_email,
                u.student_id,
                ft.form_name,
                ft.form_code,
                ft.workflow_stage
            FROM form_submissions fs
            JOIN users u ON fs.user_id = u.id
            JOIN form_types ft ON fs.form_type_id = ft.id
            JOIN supervisor_consent_forms scf ON scf.student_id = u.id
            JOIN form_submissions consent_fs ON scf.form_submission_id = consent_fs.id
            WHERE scf.supervisor_id = $1 
            AND fs.supervisor_approval_status = 'pending'
            AND ft.requires_supervisor_approval = true
            AND consent_fs.status = 'approved'
            ORDER BY fs.submitted_at ASC
        `;

        const result = await req.app.locals.db.query(pendingQuery, [supervisorId]);

        res.json({
            success: true,
            data: {
                pendingApprovals: result.rows
            }
        });
    } catch (error) {
        console.error('Error fetching supervisor pending approvals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending approvals',
            error: error.message
        });
    }
});

router.put('/supervisor/approvals/:submissionId', async (req, res) => {
    try {
        if (req.user.role !== 'supervisor') {
            return res.status(403).json({
                success: false,
                message: 'Supervisor access required'
            });
        }

        const { submissionId } = req.params;
        // Extract action and comments from request body (used by FormController)
        const supervisorId = req.user.id;

        // Verify this supervisor can approve this submission
        const verifyQuery = `
            SELECT fs.id 
            FROM form_submissions fs
            JOIN users u ON fs.user_id = u.id
            JOIN supervisor_consent_forms scf ON scf.student_id = u.id
            JOIN form_submissions consent_fs ON scf.form_submission_id = consent_fs.id
            WHERE fs.id = $1 AND scf.supervisor_id = $2 AND consent_fs.status = 'approved'
        `;

        const verifyResult = await req.app.locals.db.query(verifyQuery, [submissionId, supervisorId]);

        if (verifyResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to approve this submission'
            });
        }

        // Use the admin controller method with supervisor approval type
        req.body.approvalType = 'supervisor';
        await FormController.updateFormApproval(req, res);

    } catch (error) {
        console.error('Error updating supervisor approval:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update approval',
            error: error.message
        });
    }
});

// Student dashboard summary
router.get('/dashboard/summary', async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Student access required'
            });
        }

        const userId = req.user.id;

        // Get workflow status
        const workflowStatus = await WorkflowService.getStudentWorkflowStatus(userId);
        
        // Get recent submissions
        const recentSubmissionsQuery = `
            SELECT 
                fs.id,
                fs.status,
                fs.submitted_at,
                fs.admin_approval_status,
                fs.supervisor_approval_status,
                ft.form_name,
                ft.form_code
            FROM form_submissions fs
            JOIN form_types ft ON fs.form_type_id = ft.id
            WHERE fs.user_id = $1
            ORDER BY fs.submitted_at DESC
            LIMIT 5
        `;

        const recentSubmissions = await req.app.locals.db.query(recentSubmissionsQuery, [userId]);

        // Get unread notifications count
        const unreadCount = await NotificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: {
                workflowStatus,
                recentSubmissions: recentSubmissions.rows,
                unreadNotifications: unreadCount
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard summary',
            error: error.message
        });
    }
});

module.exports = router;