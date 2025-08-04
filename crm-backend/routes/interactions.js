const express = require('express');
const { Interaction, Customer, User } = require('../models');
const { authenticateToken, requireUser } = require('../middleware/auth');
const { validate, interactionSchema } = require('../middleware/validation');

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

// GET /api/interactions - Get all interactions
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, customerId, type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (customerId) {
      whereClause.customerId = customerId;
    }
    if (type) {
      whereClause.type = type;
    }

    const interactions = await Interaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: interactions.count,
      pages: Math.ceil(interactions.count / limit)
    };

    successResponse(res, {
      interactions: interactions.rows,
      pagination
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// POST /api/interactions - Create new interaction
router.post('/', validate(interactionSchema), async (req, res) => {
  try {
    const { customerId, type, notes, date } = req.body;

    // Verify customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return errorResponse(res, 'Customer not found', 'NOT_FOUND', 404);
    }

    const interaction = await Interaction.create({
      customer_id: customerId,
      type,
      notes,
      date: date || new Date(),
      created_by: req.user.id
    });

    // Fetch interaction with associations
    const interactionWithAssociations = await Interaction.findByPk(interaction.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    successResponse(res, {
      interaction: interactionWithAssociations
    }, 'Interaction created successfully', 201);
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

module.exports = router; 