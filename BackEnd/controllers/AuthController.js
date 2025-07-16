const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendResponse, sendError } = require('../views/ResponseView');

class AuthController {
  constructor() {
    // Bind methods to maintain 'this' context
    this.signup = this.signup.bind(this);
    this.login = this.login.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.getExtendedProfile = this.getExtendedProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.verifyToken = this.verifyToken.bind(this);
    this.getUsersByRole = this.getUsersByRole.bind(this);
  }

  // Initialize User model with database connection
  getUserModel(req) {
    return new User(req.app.locals.db);
  }

  // @desc    Register a new user
  // @access  Public
  async signup(req, res) {
    try {
      const userModel = this.getUserModel(req);
      
      // Check if user already exists
      const existingUser = await userModel.findByEmail(req.body.email);
      if (existingUser) {
        return sendError(res, 'User with this email already exists', 400);
      }

      // Validate admin code if role is admin
      if (req.body.role === 'admin') {
        const validAdminCode = process.env.ADMIN_ACCESS_CODE || 'ADMIN_2024_PHD_TRACKER';
        if (req.body.adminCode !== validAdminCode) {
          return sendError(res, 'Invalid admin access code', 400);
        }
      }

      // Prepare user data
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

      // Create user
      const newUser = await userModel.create(userData);

      // Generate JWT token
      const token = generateToken({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      });

      // Send response
      sendResponse(res, 'User created successfully', {
        token,
        user: {
          id: newUser.id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          institution: newUser.institution,
          title: newUser.title
        }
      }, 201);

    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle database constraint errors
      if (error.code === '23505') {
        return sendError(res, 'User with this email already exists', 400);
      }
      
      sendError(res, 'Server error during registration', 500, 
        process.env.NODE_ENV === 'development' ? error.message : undefined
      );
    }
  }

  // @desc    Authenticate user and return token
  // @access  Public
  async login(req, res) {
    try {
      const userModel = this.getUserModel(req);
      const { email, password } = req.body;

      // Find user by email
      const user = await userModel.findByEmail(email);
      if (!user) {
        return sendError(res, 'Invalid email or password', 401);
      }

      // Verify password
      const isValidPassword = await userModel.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return sendError(res, 'Invalid email or password', 401);
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Send response
      sendResponse(res, 'Login successful', {
        token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          department: user.department,
          institution: user.institution,
          title: user.title
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      sendError(res, 'Server error during login', 500,
        process.env.NODE_ENV === 'development' ? error.message : undefined
      );
    }
  }

  // @desc    Get current user profile
  // @access  Private
  async getProfile(req, res) {
    try {
      const userModel = this.getUserModel(req);
      const user = await userModel.findById(req.user.id);

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      sendResponse(res, 'Profile retrieved successfully', {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          department: user.department,
          institution: user.institution,
          title: user.title
        }
      });

    } catch (error) {
      console.error('Profile fetch error:', error);
      sendError(res, 'Server error while fetching profile', 500);
    }
  }

  // @desc    Get extended user profile with all fields
  // @access  Private
  async getExtendedProfile(req, res) {
    try {
      const userModel = this.getUserModel(req);
      const user = await userModel.findById(req.user.id);

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      // Remove sensitive fields
      const { password_hash, admin_code, ...userProfile } = user;

      sendResponse(res, 'Extended profile retrieved successfully', {
        user: userProfile
      });

    } catch (error) {
      console.error('Extended profile fetch error:', error);
      sendError(res, 'Server error while fetching extended profile', 500);
    }
  }

  // @desc    Update user profile
  // @access  Private
  async updateProfile(req, res) {
    try {
      const userModel = this.getUserModel(req);
      
      // Prepare update data (exclude sensitive fields)
      const { password, email, role, adminCode, ...updateData } = req.body;
      
      const updatedUser = await userModel.update(req.user.id, updateData);

      if (!updatedUser) {
        return sendError(res, 'Failed to update profile', 400);
      }

      sendResponse(res, 'Profile updated successfully', {
        user: updatedUser
      });

    } catch (error) {
      console.error('Profile update error:', error);
      sendError(res, 'Server error while updating profile', 500);
    }
  }

  // @desc    Change user password
  // @access  Private
  async changePassword(req, res) {
    try {
      const userModel = this.getUserModel(req);
      const { currentPassword, newPassword } = req.body;

      // Get current user to verify password
      const user = await userModel.findById(req.user.id);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      // Verify current password
      const isValidPassword = await userModel.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return sendError(res, 'Current password is incorrect', 400);
      }

      // Change password
      await userModel.changePassword(req.user.id, newPassword);

      sendResponse(res, 'Password changed successfully');

    } catch (error) {
      console.error('Password change error:', error);
      sendError(res, 'Server error while changing password', 500);
    }
  }

  // @desc    Verify JWT token
  // @access  Private
  async verifyToken(req, res) {
    try {
      const userModel = this.getUserModel(req);
      const user = await userModel.findById(req.user.id);

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      sendResponse(res, 'Token is valid', {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          department: user.department,
          institution: user.institution,
          title: user.title
        }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      sendError(res, 'Server error during token verification', 500);
    }
  }

  // @desc    Get users by role (admin only)
  // @access  Private (Admin)
  async getUsersByRole(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return sendError(res, 'Access denied. Admin privileges required.', 403);
      }

      const userModel = this.getUserModel(req);
      const { role } = req.params;
      
      const users = await userModel.findByRole(role);

      sendResponse(res, `${role} users retrieved successfully`, {
        users,
        count: users.length
      });

    } catch (error) {
      console.error('Get users by role error:', error);
      sendError(res, 'Server error while fetching users', 500);
    }
  }
}

module.exports = new AuthController(); 