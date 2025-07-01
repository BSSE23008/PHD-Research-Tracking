const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Login validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty'),
  handleValidationErrors
];

// Signup validation rules
const validateSignup = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  body('role')
    .isIn(['student', 'supervisor', 'admin'])
    .withMessage('Role must be student, supervisor, or admin'),
  
  // Student-specific validations
  body('studentId')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Student ID is required for students')
    .isLength({ min: 3, max: 20 })
    .withMessage('Student ID must be between 3 and 20 characters'),
  
  body('enrollmentYear')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Enrollment year is required for students')
    .isInt({ min: 2000, max: new Date().getFullYear() + 5 })
    .withMessage('Please provide a valid enrollment year'),
  
  body('researchArea')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Research area is required for students')
    .isLength({ min: 3, max: 255 })
    .withMessage('Research area must be between 3 and 255 characters'),
  
  body('advisorEmail')
    .if(body('role').equals('student'))
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid advisor email'),
  
  // Supervisor-specific validations
  body('title')
    .if(body('role').equals('supervisor'))
    .notEmpty()
    .withMessage('Academic title is required for supervisors'),
  
  body('department')
    .if(body('role').equals('supervisor'))
    .notEmpty()
    .withMessage('Department is required for supervisors')
    .isLength({ min: 2, max: 255 })
    .withMessage('Department must be between 2 and 255 characters'),
  
  body('institution')
    .if(body('role').equals('supervisor'))
    .notEmpty()
    .withMessage('Institution is required for supervisors')
    .isLength({ min: 2, max: 255 })
    .withMessage('Institution must be between 2 and 255 characters'),
  
  // Admin-specific validations
  body('adminCode')
    .if(body('role').equals('admin'))
    .notEmpty()
    .withMessage('Admin access code is required for administrators')
    .isLength({ min: 6 })
    .withMessage('Admin code must be at least 6 characters long'),
  
  body('agreeToTerms')
    .equals('true')
    .withMessage('You must agree to the terms and conditions'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('researchArea')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Research area must be between 3 and 255 characters'),
  
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateSignup,
  validateProfileUpdate,
  validatePasswordChange
}; 