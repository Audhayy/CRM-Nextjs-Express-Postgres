const express = require('express');
const { Op } = require('sequelize');
const { Task, Customer, User } = require('../models');
const { authenticateToken, requireUser } = require('../middleware/auth');
const { validate, taskSchema, updateTaskStatusSchema } = require('../middleware/validation');

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
router.use(requireUser);

// GET /api/tasks - Get all tasks with filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, assignedTo, customerId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (priority) {
      whereClause.priority = priority;
    }
    if (assignedTo) {
      whereClause.assignedTo = assignedTo;
    }
    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Get tasks with pagination
    const tasks = await Task.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['dueDate', 'ASC'], ['priority', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(tasks.count / limit);
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: tasks.count,
      pages: totalPages
    };

    successResponse(res, {
      tasks: tasks.rows,
      pagination
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// POST /api/tasks - Create new task
router.post('/', validate(taskSchema), async (req, res) => {
  try {
    const task = await Task.create(req.body);
    
    // Fetch task with associations
    const taskWithAssociations = await Task.findByPk(task.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    successResponse(res, {
      task: taskWithAssociations
    }, 'Task created successfully', 201);
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company', 'phone']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!task) {
      return errorResponse(res, 'Task not found', 'NOT_FOUND', 404);
    }

    successResponse(res, {
      task
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', validate(taskSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      return errorResponse(res, 'Task not found', 'NOT_FOUND', 404);
    }

    await task.update(req.body);

    // Fetch updated task with associations
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    successResponse(res, {
      task: updatedTask
    }, 'Task updated successfully');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// PUT /api/tasks/:id/status - Update task status
router.put('/:id/status', validate(updateTaskStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return errorResponse(res, 'Task not found', 'NOT_FOUND', 404);
    }

    await task.update({ status });

    // Fetch updated task with associations
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    successResponse(res, {
      task: updatedTask
    }, 'Task status updated successfully');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      return errorResponse(res, 'Task not found', 'NOT_FOUND', 404);
    }

    await task.destroy();

    successResponse(res, {}, 'Task deleted successfully');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

module.exports = router; 