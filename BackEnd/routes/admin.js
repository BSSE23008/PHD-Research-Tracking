const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const AuthController = require('../controllers/AuthController');
const WorkflowService = require('../services/WorkflowService');
const NotificationService = require('../services/NotificationService');
const { authenticateToken } = require('../middleware/auth');
const { validateSignup } = require('../middleware/validation');

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

// Apply middleware to all routes
router.use(authenticateToken, requireAdmin);

// Dashboard routes
router.get('/dashboard', AdminController.getDashboard);

// Student Management (Admin only)
router.post('/students', AdminController.addStudent);
router.get('/students', AdminController.getAllStudents);
router.get('/students/:id', AdminController.getStudentById);
router.put('/students/:id', AdminController.updateStudent);
router.post('/students/assign-supervisor', AdminController.assignSupervisor);
router.post('/students/update-semester', AdminController.updateStudentSemester);

// Department Management
router.get('/departments', AdminController.getDepartments);
router.post('/departments', AdminController.addDepartment);

// Reports
router.get('/reports/progress', AdminController.getProgressReport);
router.post('/forms/submissions/:submissionId/approve', AdminController.approveFormSubmission);
router.post('/forms/submissions/:submissionId/reject', AdminController.rejectFormSubmission);
router.delete('/forms/submissions/:submissionId', AdminController.deleteFormSubmission);

// Comprehensive exam routes
router.get('/exams', AdminController.getComprehensiveExams);
router.get('/exams/:examId', AdminController.getExamDetails);
router.post('/exams/:examId/schedule', AdminController.scheduleExam);
router.put('/exams/:examId/result', AdminController.updateExamResult);

// Thesis defense routes
router.get('/defenses', AdminController.getThesisDefenses);
router.get('/defenses/:defenseId', AdminController.getDefenseDetails);
router.post('/defenses/:defenseId/schedule', AdminController.scheduleDefense);
router.put('/defenses/:defenseId/result', AdminController.updateDefenseResult);

// System statistics
router.get('/stats/detailed', AdminController.getDetailedStatistics);
router.get('/stats/workflow', async (req, res) => {
    try {
        const stats = await WorkflowService.getWorkflowStatistics();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching workflow statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflow statistics',
            error: error.message
        });
    }
});

// Pending approvals
router.get('/approvals', AdminController.getPendingApprovals);
router.post('/approvals/:approvalId/process', AdminController.processApproval);

// System logs
router.get('/logs', AdminController.getSystemLogs);

// User management routes
router.get('/users', AdminController.getAllUsers);
router.post('/users', validateSignup, async (req, res) => {
    // Use the existing signup functionality for creating users
    await AuthController.signup(req, res);
});
router.put('/users/:userId/status', AdminController.updateUserStatus);

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

module.exports = router; 