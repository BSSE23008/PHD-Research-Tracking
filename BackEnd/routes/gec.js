const express = require('express');
const router = express.Router();
const GECController = require('../controllers/GECController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get student's GEC committee
router.get('/my-committee', authenticateToken, requireRole(['student']), GECController.getMyCommittee);

// Get all GEC committees (Admin only)
router.get('/', authenticateToken, requireRole(['admin']), GECController.getAllCommittees);

// Get GEC committee by ID
router.get('/:id', authenticateToken, GECController.getCommitteeById);

// Create new GEC committee (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), GECController.createCommittee);

// Update GEC committee (Admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), GECController.updateCommittee);

// Add member to GEC committee (Admin only)
router.post('/:id/members', authenticateToken, requireRole(['admin']), GECController.addMember);

// Remove member from GEC committee (Admin only)
router.delete('/:committee_id/members/:member_id', authenticateToken, requireRole(['admin']), GECController.removeMember);

// Student request for GEC committee change
router.post('/change-request', authenticateToken, requireRole(['student']), GECController.createChangeRequest);

// Get change requests (Admin and Supervisors can view)
router.get('/change-requests/all', authenticateToken, GECController.getChangeRequests);

// Get student's change requests
router.get('/change-requests/my-requests', authenticateToken, requireRole(['student']), GECController.getMyChangeRequests);

// Approve/Reject change request (Admin and Supervisors)
router.post('/change-requests/:id/approve', authenticateToken, GECController.approveChangeRequest);

// Get GEC committee statistics (Admin only)
router.get('/reports/statistics', authenticateToken, requireRole(['admin']), GECController.getStatistics);

module.exports = router; 