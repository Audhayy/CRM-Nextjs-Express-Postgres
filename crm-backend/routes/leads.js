const express = require('express');
const { Op } = require('sequelize');
const { Lead, Customer, User, sequelize } = require('../models');
const { authenticateToken, requireUser } = require('../middleware/auth');
const { validate, leadSchema, updateLeadStageSchema } = require('../middleware/validation');

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

// GET /api/leads - Get all leads with filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, stage, customerId, assignedTo } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (stage) {
      whereClause.stage = stage;
    }
    if (customerId) {
      whereClause.customerId = customerId;
    }
    if (assignedTo) {
      whereClause.assignedTo = assignedTo;
    }

    // Get leads with pagination
    const leads = await Lead.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
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
    const totalPages = Math.ceil(leads.count / limit);
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: leads.count,
      pages: totalPages
    };

    successResponse(res, {
      leads: leads.rows,
      pagination
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// POST /api/leads - Create new lead
router.post('/', validate(leadSchema), async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    
    // Fetch lead with associations
    const leadWithAssociations = await Lead.findByPk(lead.id, {
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
      lead: leadWithAssociations
    }, 'Lead created successfully', 201);
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// GET /api/leads/:id - Get lead by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id, {
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

    if (!lead) {
      return errorResponse(res, 'Lead not found', 'NOT_FOUND', 404);
    }

    successResponse(res, {
      lead
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', validate(leadSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return errorResponse(res, 'Lead not found', 'NOT_FOUND', 404);
    }

    await lead.update(req.body);

    // Fetch updated lead with associations
    const updatedLead = await Lead.findByPk(id, {
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
      lead: updatedLead
    }, 'Lead updated successfully');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// PUT /api/leads/:id/stage - Update lead stage (for drag-and-drop)
router.put('/:id/stage', validate(updateLeadStageSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return errorResponse(res, 'Lead not found', 'NOT_FOUND', 404);
    }

    const oldStage = lead.stage;
    await lead.update({ stage });

    // Fetch updated lead with associations
    const updatedLead = await Lead.findByPk(id, {
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
      lead: updatedLead,
      oldStage,
      newStage: stage
    }, 'Lead stage updated successfully');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return errorResponse(res, 'Lead not found', 'NOT_FOUND', 404);
    }

    await lead.destroy();

    successResponse(res, {}, 'Lead deleted successfully');
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// GET /api/leads/stats - Get pipeline statistics
router.get('/stats/overview', async (req, res) => {
  try {
    // Get counts by stage
    const stageStats = await Lead.findAll({
      attributes: [
        'stage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('value')), 'totalValue']
      ],
      group: ['stage'],
      raw: true
    });

    // Calculate total values
    const totalValue = stageStats.reduce((sum, stat) => {
      return sum + (parseFloat(stat.totalValue) || 0);
    }, 0);

    // Calculate conversion rate
    const totalLeads = stageStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
    const closedLeads = stageStats.find(stat => stat.stage === 'closed')?.count || 0;
    const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

    // Format response
    const stages = {
      lead: 0,
      qualified: 0,
      proposal: 0,
      closed: 0
    };

    stageStats.forEach(stat => {
      stages[stat.stage] = parseInt(stat.count);
    });

    successResponse(res, {
      stages,
      totalValue: parseFloat(totalValue.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      totalLeads
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

module.exports = router; 