const express = require('express');
const router = express.Router();
const FacultyController = require('../controllers/FacultyController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Faculty dashboard and student management (SPECIFIC ROUTES FIRST)
router.get('/dashboard', authenticateToken, requireRole(['faculty']), FacultyController.getFacultyDashboard);
router.get('/my-students', authenticateToken, requireRole(['faculty']), FacultyController.getMyStudents);

// Get faculty workload summary (SPECIFIC ROUTE)
router.get('/reports/workload', authenticateToken, requireRole(['admin']), FacultyController.getWorkloadSummary);

// Get faculty by role (SPECIFIC ROUTE)
router.get('/role/:role', authenticateToken, FacultyController.getFacultyByRole);

// DPRC-specific routes (SPECIFIC ROUTES)
router.get('/dprc/dashboard', authenticateToken, requireRole(['faculty']), FacultyController.getDPRCDashboard);
router.post('/dprc/forms/:submissionId/approve', authenticateToken, requireRole(['faculty']), FacultyController.processDPRCApproval);
router.post('/dprc/forms/:submissionId/reject', authenticateToken, requireRole(['faculty']), FacultyController.processDPRCApproval);
router.get('/dprc/forms/:submissionId', authenticateToken, requireRole(['faculty']), FacultyController.getDPRCFormDetails);

// Get pending approvals for faculty member (SPECIFIC ROUTE)
router.get('/:faculty_id/pending-approvals', authenticateToken, FacultyController.getPendingApprovals);

// Get form submission details for viewing (SPECIFIC ROUTE)
router.get('/forms/submissions/:submissionId', authenticateToken, FacultyController.getFormSubmissionDetails);

// Alternative approval route that matches frontend expectation (SPECIFIC ROUTE)
router.post('/forms/submissions/:submissionId/:action', authenticateToken, FacultyController.approveForm);

// Get all faculty members (GENERIC ROUTE)
router.get('/', authenticateToken, FacultyController.getAllFaculty);

// Get faculty by ID (PARAMETERIZED ROUTE - LAST)
router.get('/:id', authenticateToken, FacultyController.getFacultyById);

// Add new faculty member (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), FacultyController.addFaculty);

// Update faculty member (Admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), FacultyController.updateFaculty);

// Assign role to faculty member (Admin only)
router.post('/roles/assign', authenticateToken, requireRole(['admin']), FacultyController.assignRole);

// Remove role from faculty member (Admin only)
router.delete('/roles/remove', authenticateToken, requireRole(['admin']), FacultyController.removeRole);

// Approve/Reject form submission
router.post('/approve', authenticateToken, FacultyController.approveForm);

module.exports = router; 