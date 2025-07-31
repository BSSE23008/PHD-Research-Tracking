const express = require('express');
const router = express.Router();
const FacultyController = require('../controllers/FacultyController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all faculty members
router.get('/', authenticateToken, FacultyController.getAllFaculty);

// Get faculty by ID
router.get('/:id', authenticateToken, FacultyController.getFacultyById);

// Get faculty by role
router.get('/role/:role', authenticateToken, FacultyController.getFacultyByRole);

// Get faculty workload summary
router.get('/reports/workload', authenticateToken, requireRole(['admin']), FacultyController.getWorkloadSummary);

// Add new faculty member (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), FacultyController.addFaculty);

// Update faculty member (Admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), FacultyController.updateFaculty);

// Assign role to faculty member (Admin only)
router.post('/roles/assign', authenticateToken, requireRole(['admin']), FacultyController.assignRole);

// Remove role from faculty member (Admin only)
router.delete('/roles/remove', authenticateToken, requireRole(['admin']), FacultyController.removeRole);

// Get pending approvals for faculty member
router.get('/:faculty_id/pending-approvals', authenticateToken, FacultyController.getPendingApprovals);

// Approve/Reject form submission
router.post('/approve', authenticateToken, FacultyController.approveForm);

// Alternative approval route that matches frontend expectation
router.post('/forms/submissions/:submissionId/:action', authenticateToken, FacultyController.approveForm);

// Get form submission details for viewing
router.get('/forms/submissions/:submissionId', authenticateToken, FacultyController.getFormSubmissionDetails);

module.exports = router; 