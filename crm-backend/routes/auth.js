const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validate, loginSchema, registerSchema } = require('../middleware/validation');

const router = express.Router();

// Helper function for generating JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    'your-super-secret-jwt-key-here',
    { expiresIn: '24h' }
  );
};

// Helper function for standardized responses
const successResponse = (res, data, message = 'Success', status = 200) => {
  res.status(status).json({
    success: true,
    data,
    message
  });
};

const errorResponse = (res, error, code = 'ERROR', status = 500) => {
  res.status(status).json({
    success: false,
    error: error.message || error,
    code
  });
};

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 'DUPLICATE_ENTRY', 409);
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // Generate token
    const token = generateToken(user);

    successResponse(res, {
      user: user.toJSON(),
      token
    }, 'User registered successfully', 201);
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Invalid credentials', 'AUTHENTICATION_ERROR', 401);
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return errorResponse(res, 'Invalid credentials', 'AUTHENTICATION_ERROR', 401);
    }

    // Generate token
    const token = generateToken(user);

    successResponse(res, {
      user: user.toJSON(),
      token
    }, 'Login successful');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    successResponse(res, {
      user: req.user.toJSON()
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  successResponse(res, {}, 'Logout successful');
});

// POST /api/auth/refresh
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user);

    successResponse(res, {
      user: req.user.toJSON(),
      token
    }, 'Token refreshed successfully');
  } catch (error) {
    errorResponse(res, error, 'AUTHENTICATION_ERROR');
  }
});

module.exports = router; 