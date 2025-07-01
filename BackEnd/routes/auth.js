const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { 
  validateLogin, 
  validateSignup, 
  validateProfileUpdate, 
  validatePasswordChange 
} = require('../middleware/validation');

// Initialize User model
const getUserModel = (req) => new User(req.app.locals.db);

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', validateSignup, async (req, res) => {
  try {
    const userModel = getUserModel(req);
    
    // Check if user already exists
    const existingUser = await userModel.findByEmail(req.body.email);
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Validate admin code if role is admin
    if (req.body.role === 'admin') {
      const validAdminCode = 'ADMIN_2024_PHD_TRACKER'; // In production, store this securely
      if (req.body.adminCode !== validAdminCode) {
        return res.status(400).json({ 
          message: 'Invalid admin access code' 
        });
      }
    }

    // Create user
    const userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      // Student fields
      studentId: req.body.studentId,
      enrollmentYear: req.body.enrollmentYear,
      researchArea: req.body.researchArea,
      advisorEmail: req.body.advisorEmail,
      // Supervisor fields
      title: req.body.title,
      department: req.body.department,
      institution: req.body.institution,
      officeLocation: req.body.officeLocation,
      researchInterests: req.body.researchInterests,
      maxStudents: req.body.maxStudents,
      // Admin fields
      adminCode: req.body.adminCode
    };

    const newUser = await userModel.create(userData);

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle database constraint errors
    if (error.code === '23505') {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and return token
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const userModel = getUserModel(req);
    const { email, password } = req.body;

    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Verify password
    const isValidPassword = await userModel.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userModel = getUserModel(req);
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.json({
      message: 'Profile retrieved successfully',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validateProfileUpdate, async (req, res) => {
  try {
    const userModel = getUserModel(req);
    
    const updateData = {};
    const allowedFields = [
      'firstName', 'lastName', 'studentId', 'enrollmentYear', 
      'researchArea', 'advisorEmail', 'title', 'department', 
      'institution', 'officeLocation', 'researchInterests', 'maxStudents'
    ];

    // Map frontend field names to database field names
    const fieldMapping = {
      firstName: 'first_name',
      lastName: 'last_name',
      studentId: 'student_id',
      enrollmentYear: 'enrollment_year',
      researchArea: 'research_area',
      advisorEmail: 'advisor_email',
      officeLocation: 'office_location',
      researchInterests: 'research_interests',
      maxStudents: 'max_students'
    };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const dbField = fieldMapping[field] || field;
        updateData[dbField] = req.body[field];
      }
    }

    const updatedUser = await userModel.update(req.user.id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ 
        message: 'User not found or update failed' 
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        role: updatedUser.role,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, validatePasswordChange, async (req, res) => {
  try {
    const userModel = getUserModel(req);
    const { currentPassword, newPassword } = req.body;

    // Get current user with password hash
    const user = await userModel.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Verify current password
    const isValidPassword = await userModel.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    await userModel.changePassword(req.user.id, newPassword);

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      message: 'Server error while changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Verify if token is valid
// @access  Private
router.post('/verify-token', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  // In a JWT implementation, logout is typically handled client-side
  // by removing the token from storage
  res.json({
    message: 'Logged out successfully'
  });
});

module.exports = router; 