const jwt = require('jsonwebtoken');
const config = require('../config/env');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired. Please login again.' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.' 
      });
    } else {
      return res.status(500).json({ 
        message: 'Token verification failed.' 
      });
    }
  }
};

// Middleware to check user role - FIXED VERSION
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Access denied. Authentication required.' 
      });
    }

    // For faculty routes, check if user has faculty role
    if (req.path.includes('/faculty/') || req.originalUrl.includes('/faculty/')) {
        // console.log('🔍 Faculty route detected, checking faculty role:', req.path);
      
      // Check if user has faculty role OR if the required roles include faculty
      if (req.user.role === 'faculty' || roles.includes('faculty')) {
        // console.log('✅ Faculty role check passed');
        return next();
      } else {
        // console.log('❌ Faculty role check failed - user role:', req.user.role);
        return res.status(403).json({ 
          message: 'Access denied. Faculty role required.' 
        });
      }
    }

    // For non-faculty routes, check against required roles
    // console.log('🔍 Checking role:', req.user.role, 'against required roles:', roles);
    
    if (!roles.includes(req.user.role)) {
      // console.log('❌ Role check failed');
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    // console.log('✅ Role check passed');
    next();
  };
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Verify and decode token without middleware
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch {
    return null;
  }
};

// Alias for authorizeRole for consistency
const requireRole = (...roles) => {
  return authorizeRole(...roles);
};

module.exports = {
  authenticateToken,
  authorizeRole,
  requireRole,
  generateToken,
  verifyToken
}; 