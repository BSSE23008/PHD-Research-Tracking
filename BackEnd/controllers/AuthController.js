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

  // Get User model instance
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
        departmentId: req.body.departmentId,
        enrollmentYear: req.body.enrollmentYear,
        currentSemester: req.body.currentSemester || '1st',
        academicYear: req.body.academicYear,
        researchArea: req.body.researchArea,
        // Admin fields
        adminCode: req.body.adminCode,
        adminPermissions: req.body.adminPermissions
      };

      // Create user
      const newUser = await userModel.create(userData);

      // Generate JWT token
      const token = generateToken({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      });

      // Get complete user profile
      const completeUser = await userModel.findById(newUser.id);

      // Send response
      sendResponse(res, 'User registered successfully', {
        token,
        user: this.formatUserResponse(completeUser)
      }, 201);

    } catch (error) {
      console.error('Signup error:', error);
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

      // Update last login
      await userModel.updateLastLogin(user.id);

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Send response with complete user data
      sendResponse(res, 'Login successful', {
        token,
        user: this.formatUserResponse(user)
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
        user: this.formatUserResponse(user)
      });

    } catch (error) {
      console.error('Profile fetch error:', error);
      sendError(res, 'Server error while fetching profile', 500);
    }
  }

  // @desc    Get extended user profile (with workflow progress for students)
  // @access  Private
  async getExtendedProfile(req, res) {
    try {
      const userModel = this.getUserModel(req);
      const user = await userModel.findByIdExtended(req.user.id);

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      sendResponse(res, 'Extended profile retrieved successfully', {
        user: this.formatUserResponse(user, true)
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
      
      const allowedFields = [
        'first_name', 'last_name', 'student_id', 'department_id', 
        'current_semester', 'academic_year', 'research_area'
      ];

      const updateData = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return sendError(res, 'No valid fields provided for update', 400);
      }

      const updatedUser = await userModel.update(req.user.id, updateData);
      if (!updatedUser) {
        return sendError(res, 'User not found or update failed', 404);
      }

      // Get complete updated profile
      const completeUser = await userModel.findById(req.user.id);

      sendResponse(res, 'Profile updated successfully', {
        user: this.formatUserResponse(completeUser)
      });

    } catch (error) {
      console.error('Profile update error:', error);
      sendError(res, 'Server error during profile update', 500);
    }
  }

  // @desc    Change user password
  // @access  Private
  async changePassword(req, res) {
    try {
      const userModel = this.getUserModel(req);
      const { currentPassword, newPassword } = req.body;

      // Get current user
      const user = await userModel.findById(req.user.id);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      // Verify current password
      const isValidPassword = await userModel.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return sendError(res, 'Current password is incorrect', 400);
      }

      // Update password
      const result = await userModel.changePassword(req.user.id, newPassword);
      if (!result) {
        return sendError(res, 'Password change failed', 500);
      }

      sendResponse(res, 'Password changed successfully');

    } catch (error) {
      console.error('Password change error:', error);
      sendError(res, 'Server error during password change', 500);
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
        user: this.formatUserResponse(user)
      });

    } catch (error) {
      console.error('Token verification error:', error);
      sendError(res, 'Server error during token verification', 500);
    }
  }

  // @desc    Get users by role
  // @access  Private (Admin only)
  async getUsersByRole(req, res) {
    try {
      const userModel = this.getUserModel(req);
      const { role } = req.params;

      const users = await userModel.findByRole(role);

      sendResponse(res, `${role} users retrieved successfully`, {
        users: users.map(user => this.formatUserResponse(user))
      });

    } catch (error) {
      console.error('Get users by role error:', error);
      sendError(res, 'Server error while fetching users', 500);
    }
  }

  // Helper method to format user response
  formatUserResponse(user, includeExtended = false) {
    if (!user) return null;

    const baseResponse = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login
    };

    // Add student-specific fields
    if (user.role === 'student') {
      baseResponse.student_id = user.student_id;
      baseResponse.department_id = user.department_id;
      baseResponse.department = user.dept_name;
      baseResponse.department_code = user.dept_code;
      baseResponse.current_semester = user.current_semester;
      baseResponse.academic_year = user.academic_year;
      baseResponse.enrollment_year = user.enrollment_year;
      baseResponse.enrollment_date = user.enrollment_date;
      baseResponse.research_area = user.research_area;
      baseResponse.primary_supervisor_id = user.primary_supervisor_id;
      baseResponse.primary_supervisor_name = user.primary_supervisor_name;
      baseResponse.primary_supervisor_email = user.primary_supervisor_email;
      baseResponse.primary_supervisor_designation = user.primary_supervisor_designation;
      baseResponse.co_supervisor_id = user.co_supervisor_id;
      baseResponse.co_supervisor_name = user.co_supervisor_name;
      baseResponse.co_supervisor_email = user.co_supervisor_email;
      baseResponse.co_supervisor_designation = user.co_supervisor_designation;

      // Include workflow progress if available
      if (includeExtended) {
        baseResponse.current_stage = user.current_stage;
        baseResponse.total_forms_submitted = user.total_forms_submitted;
        baseResponse.total_forms_approved = user.total_forms_approved;
        baseResponse.has_pending_actions = user.has_pending_actions;
        baseResponse.current_gpa = user.current_gpa;
      }
    }

    // Add admin-specific fields
    if (user.role === 'admin') {
      try {
        baseResponse.admin_permissions = user.admin_permissions ? JSON.parse(user.admin_permissions) : [];
      } catch (error) {
        console.error('Error parsing admin_permissions:', error);
        baseResponse.admin_permissions = [];
      }
    }

    // Add faculty-specific fields
    if (user.role === 'faculty') {
      baseResponse.department_id = user.department_id;
      baseResponse.department = user.dept_name;
      baseResponse.department_code = user.dept_code;
    }

    return baseResponse;
  }

  // Allow students to assign supervisor during onboarding
  async assignSupervisorOnboarding(req, res) {
    const { pool } = require('../config/database');
    
    try {
      const { supervisor_id, supervisor_type = 'primary' } = req.body;
      const student_id = req.user.id; // Get student ID from authenticated user

      // Ensure only students can use this endpoint
      if (req.user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only available for students'
        });
      }

      if (!supervisor_id) {
        return res.status(400).json({
          success: false,
          message: 'Supervisor ID is required'
        });
      }

      // Check if faculty exists and can supervise
      // First try faculty table, then users table (for faculty with login credentials)
      let facultyCheck = await pool.query(
        'SELECT id, max_phd_students, current_phd_students FROM faculty WHERE id = $1 AND is_active = true AND can_supervise = true',
        [supervisor_id]
      );

      let faculty = null;
      let actualFacultyId = supervisor_id;

      if (facultyCheck.rows.length > 0) {
        faculty = facultyCheck.rows[0];
        console.log('Found faculty in faculty table:', faculty);
      } else {
        console.log('Faculty not found in faculty table, checking users table...');
        // Check if it's a faculty user in the users table
        const facultyUserCheck = await pool.query(`
          SELECT u.id as user_id, f.id as faculty_id, f.max_phd_students, f.current_phd_students 
          FROM users u
          JOIN faculty f ON u.email = f.email
          WHERE u.id = $1 AND u.role = $2 AND u.is_active = true AND f.is_active = true AND f.can_supervise = true
        `, [supervisor_id, 'faculty']);

        if (facultyUserCheck.rows.length > 0) {
          const result = facultyUserCheck.rows[0];
          faculty = {
            id: result.faculty_id,
            max_phd_students: result.max_phd_students,
            current_phd_students: result.current_phd_students
          };
          actualFacultyId = result.faculty_id; // Use the faculty table ID for foreign key
          console.log('Found faculty in users table:', faculty);
        } else {
          // Let's check what faculty records exist for debugging
          const allFacultyCheck = await pool.query(
            'SELECT id, first_name, last_name, email, is_active, can_supervise FROM faculty WHERE id = $1',
            [supervisor_id]
          );
          
          if (allFacultyCheck.rows.length > 0) {
            const facultyRecord = allFacultyCheck.rows[0];
            console.log('Faculty record exists but has issues:', facultyRecord);
            return res.status(400).json({
              success: false,
              message: `Faculty found but ${!facultyRecord.is_active ? 'is not active' : 'cannot supervise'}`
            });
          }
          
          return res.status(404).json({
            success: false,
            message: 'Faculty not found or cannot supervise'
          });
        }
      }

      // Check capacity for primary supervisor
      if (supervisor_type === 'primary' && faculty.current_phd_students >= faculty.max_phd_students) {
        return res.status(400).json({
          success: false,
          message: 'Faculty has reached maximum supervision capacity'
        });
      }

      // Update student record
      const field = supervisor_type === 'primary' ? 'primary_supervisor_id' : 'co_supervisor_id';
      const result = await pool.query(`
        UPDATE users 
        SET ${field} = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND role = 'student'
        RETURNING id, first_name, last_name, student_id
      `, [actualFacultyId, student_id]);

      // Update faculty supervision count if primary supervisor
      if (supervisor_type === 'primary') {
        await pool.query(
          'UPDATE faculty SET current_phd_students = current_phd_students + 1 WHERE id = $1',
          [actualFacultyId]
        );
      }

      res.json({
        success: true,
        message: `${supervisor_type === 'primary' ? 'Primary' : 'Co'}-supervisor assigned successfully during onboarding`,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error assigning supervisor during onboarding:', error);
      res.status(500).json({
        success: false,
        message: 'Error assigning supervisor during onboarding',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController(); 