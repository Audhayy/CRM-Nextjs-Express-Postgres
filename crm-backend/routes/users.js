const express = require('express');
const { User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper functions
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

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/users - Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: users.count,
      pages: Math.ceil(users.count / limit)
    };

    successResponse(res, {
      users: users.rows,
      pagination
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// GET /api/users/:id - Get user by ID (admin only)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', 404);
    }

    successResponse(res, {
      user
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', 404);
    }

    await user.update({ name, email, role });

    successResponse(res, {
      user: user.toJSON()
    }, 'User updated successfully');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return errorResponse(res, 'Cannot delete your own account', 'VALIDATION_ERROR', 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', 404);
    }

    await user.destroy();

    successResponse(res, {}, 'User deleted successfully');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

module.exports = router; 