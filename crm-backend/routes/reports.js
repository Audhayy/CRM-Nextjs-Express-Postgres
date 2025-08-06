const express = require('express');
const { Op } = require('sequelize');
const { Customer, Lead, Task, Interaction, sequelize } = require('../models');
const { authenticateToken, requireAdmin, requireUser } = require('../middleware/auth');

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

// GET /api/reports/dashboard - Get dashboard statistics (Admin only)
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // Get customer statistics
    const customerStats = await Customer.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "createdAt" >= date(\'now\', \'-30 days\') THEN 1 END')), 'newThisMonth']
      ],
      raw: true
    });

    // Get lead statistics
    const leadStats = await Lead.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.col('value')), 'totalValue'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN stage = \'closed\' THEN 1 END')), 'closed']
      ],
      raw: true
    });

    // Get task statistics
    const taskStats = await Task.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'completed\' THEN 1 END')), 'completed'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'pending\' THEN 1 END')), 'pending']
      ],
      raw: true
    });

    // Get pipeline statistics
    const pipelineStats = await Lead.findAll({
      attributes: [
        'stage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['stage'],
      raw: true
    });

    // Format pipeline data
    const pipeline = {
      lead: 0,
      qualified: 0,
      proposal: 0,
      closed: 0
    };

    pipelineStats.forEach(stat => {
      pipeline[stat.stage] = parseInt(stat.count);
    });

    // Calculate conversion rate
    const totalLeads = leadStats[0]?.total || 0;
    const closedLeads = leadStats[0]?.closed || 0;
    const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

    successResponse(res, {
      customers: {
        total: parseInt(customerStats[0]?.total || 0),
        newThisMonth: parseInt(customerStats[0]?.newThisMonth || 0)
      },
      leads: {
        total: parseInt(leadStats[0]?.total || 0),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        totalValue: parseFloat(leadStats[0]?.totalValue || 0)
      },
      tasks: {
        total: parseInt(taskStats[0]?.total || 0),
        completed: parseInt(taskStats[0]?.completed || 0),
        pending: parseInt(taskStats[0]?.pending || 0)
      },
      pipeline
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// GET /api/reports/dashboard-stats - Get dashboard statistics (Both admin and user)
router.get('/dashboard-stats', requireUser, async (req, res) => {
  try {
    // Get customer statistics
    const customerStats = await Customer.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "createdAt" >= date(\'now\', \'-30 days\') THEN 1 END')), 'newThisMonth']
      ],
      raw: true
    });

    // Get lead statistics
    const leadStats = await Lead.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.col('value')), 'totalValue'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN stage = \'closed\' THEN 1 END')), 'closed']
      ],
      raw: true
    });

    // Get task statistics
    const taskStats = await Task.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'completed\' THEN 1 END')), 'completed'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'pending\' THEN 1 END')), 'pending']
      ],
      raw: true
    });

    // Get pipeline statistics
    const pipelineStats = await Lead.findAll({
      attributes: [
        'stage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['stage'],
      raw: true
    });

    // Format pipeline data
    const pipeline = {
      lead: 0,
      qualified: 0,
      proposal: 0,
      closed: 0
    };

    pipelineStats.forEach(stat => {
      pipeline[stat.stage] = parseInt(stat.count);
    });

    // Calculate conversion rate
    const totalLeads = leadStats[0]?.total || 0;
    const closedLeads = leadStats[0]?.closed || 0;
    const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

    successResponse(res, {
      customers: {
        total: parseInt(customerStats[0]?.total || 0),
        newThisMonth: parseInt(customerStats[0]?.newThisMonth || 0)
      },
      leads: {
        total: parseInt(leadStats[0]?.total || 0),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        totalValue: parseFloat(leadStats[0]?.totalValue || 0)
      },
      tasks: {
        total: parseInt(taskStats[0]?.total || 0),
        completed: parseInt(taskStats[0]?.completed || 0),
        pending: parseInt(taskStats[0]?.pending || 0)
      },
      pipeline
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

// GET /api/reports/conversion - Get conversion rate data (Admin only)
router.get('/conversion', requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFormat, interval;
    switch (period) {
      case 'week':
        dateFormat = 'YYYY-WW';
        interval = '7 days';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        interval = '30 days';
        break;
      case 'quarter':
        dateFormat = 'YYYY-Q';
        interval = '90 days';
        break;
      case 'year':
        dateFormat = 'YYYY';
        interval = '365 days';
        break;
      default:
        dateFormat = 'YYYY-MM';
        interval = '30 days';
    }

    const conversionData = await Lead.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', period, sequelize.col('createdAt')), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'leads'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN stage = \'closed\' THEN 1 END')), 'closed']
      ],
      where: {
        createdAt: {
          [Op.gte]: sequelize.literal(`CURRENT_DATE - INTERVAL '${interval}'`)
        }
      },
      group: ['period'],
      order: [['period', 'ASC']],
      raw: true
    });

    // Calculate rates
    const conversionRates = conversionData.map(item => ({
      period: item.period,
      leads: parseInt(item.leads),
      closed: parseInt(item.closed),
      rate: item.leads > 0 ? parseFloat(((item.closed / item.leads) * 100).toFixed(2)) : 0
    }));

    // Calculate average rate
    const totalLeads = conversionRates.reduce((sum, item) => sum + item.leads, 0);
    const totalClosed = conversionRates.reduce((sum, item) => sum + item.closed, 0);
    const averageRate = totalLeads > 0 ? parseFloat(((totalClosed / totalLeads) * 100).toFixed(2)) : 0;

    successResponse(res, {
      conversionRates,
      averageRate
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
});

module.exports = router; 