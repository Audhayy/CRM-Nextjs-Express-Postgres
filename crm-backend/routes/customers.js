const express = require('express');
const { Op } = require('sequelize');
const { Customer, Interaction, Lead, Task } = require('../models');
const { authenticateToken, requireUser } = require('../middleware/auth');
const { validate, customerSchema, interactionSchema } = require('../middleware/validation');

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

// GET /api/customers - Get all customers with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tags } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereClause.tags = { [Op.overlap]: tagArray };
    }

    // Get customers with pagination
    const customers = await Customer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(customers.count / limit);
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: customers.count,
      pages: totalPages
    };

    successResponse(res, {
      customers: customers.rows,
      pagination
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// POST /api/customers - Create new customer
router.post('/', validate(customerSchema), async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    
    successResponse(res, {
      customer
    }, 'Customer created successfully', 201);
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: Interaction,
          as: 'interactions',
          order: [['date', 'DESC']],
          limit: 10
        },
        {
          model: Lead,
          as: 'leads',
          order: [['createdAt', 'DESC']]
        },
        {
          model: Task,
          as: 'tasks',
          order: [['dueDate', 'ASC']]
        }
      ]
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found', 'NOT_FOUND', 404);
    }

    successResponse(res, {
      customer
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', validate(customerSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return errorResponse(res, 'Customer not found', 'NOT_FOUND', 404);
    }

    await customer.update(req.body);

    successResponse(res, {
      customer
    }, 'Customer updated successfully');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return errorResponse(res, 'Customer not found', 'NOT_FOUND', 404);
    }

    await customer.destroy();

    successResponse(res, {}, 'Customer deleted successfully');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// GET /api/customers/:id/interactions - Get customer interactions
router.get('/:id/interactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const interactions = await Interaction.findAndCountAll({
      where: { customerId: id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']],
      include: [
        {
          model: require('../models').User,
          as: 'createdByUser',
          attributes: ['id', 'name']
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

// POST /api/customers/:id/interactions - Add interaction to customer
router.post('/:id/interactions', validate(interactionSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, notes, date } = req.body;

    // Verify customer exists
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return errorResponse(res, 'Customer not found', 'NOT_FOUND', 404);
    }

    const interaction = await Interaction.create({
      customer_id: id,
      type,
      notes,
      date: date || new Date(),
      created_by: req.user.id
    });

    successResponse(res, {
      interaction
    }, 'Interaction added successfully', 201);
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

module.exports = router; 