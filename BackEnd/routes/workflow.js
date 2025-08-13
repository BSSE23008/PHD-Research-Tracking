const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const WorkflowService = require('../services/WorkflowService');

// Get current workflow stage for student
router.get('/stage', authenticateToken, requireRole(['student']), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const workflowStatus = await WorkflowService.getStudentWorkflowStatus(userId);
        
        res.json({
            success: true,
            data: {
                stage: workflowStatus.currentStage || 'supervision_consent',
                progress: workflowStatus.progressPercentage || 0,
                nextStep: workflowStatus.nextStep || 'Complete initial onboarding'
            }
        });
    } catch (error) {
        console.error('Error fetching workflow stage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflow stage',
            error: error.message
        });
    }
});

// Get workflow stage for specific student (admin/faculty access)
router.get('/stage/:studentId', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        
        const workflowStatus = await WorkflowService.getStudentWorkflowStatus(studentId);
        
        res.json({
            success: true,
            data: {
                stage: workflowStatus.currentStage || 'supervision_consent',
                progress: workflowStatus.progressPercentage || 0,
                nextStep: workflowStatus.nextStep || 'Complete initial onboarding'
            }
        });
    } catch (error) {
        console.error('Error fetching workflow stage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflow stage',
            error: error.message
        });
    }
});

module.exports = router;