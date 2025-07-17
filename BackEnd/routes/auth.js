const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateLogin, 
  validateSignup, 
  validateProfileUpdate, 
  validatePasswordChange 
} = require('../middleware/validation');

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', validateSignup, AuthController.signup);

// @route   POST /api/auth/login
// @desc    Authenticate user and return token
// @access  Public
router.post('/login', validateLogin, AuthController.login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, AuthController.getProfile);

// @route   GET /api/auth/profile/extended
// @desc    Get extended user profile with all fields
// @access  Private
router.get('/profile/extended', authenticateToken, AuthController.getExtendedProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validateProfileUpdate, AuthController.updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, validatePasswordChange, AuthController.changePassword);

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', authenticateToken, AuthController.verifyToken);

// @route   GET /api/auth/users/:role
// @desc    Get users by role (admin only)
// @access  Private (Admin)
router.get('/users/:role', authenticateToken, AuthController.getUsersByRole);

module.exports = router; 