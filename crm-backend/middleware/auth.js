const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'AUTHENTICATION_ERROR'
      });
    }

    const decoded = jwt.verify(token, 'your-super-secret-jwt-key-here');
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'AUTHENTICATION_ERROR'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'AUTHENTICATION_ERROR'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'AUTHENTICATION_ERROR'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_ERROR'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTHORIZATION_ERROR'
      });
    }
    
    next();
  };
};

const requireAdmin = requireRole(['admin']);
const requireUser = requireRole(['admin', 'user']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireUser
}; 