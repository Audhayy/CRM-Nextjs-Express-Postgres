const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    next();
  };
};

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  })
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 255 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  role: Joi.string().valid('admin', 'user').default('user')
});

const customerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 255 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().allow('', null).messages({
    'string.email': 'Please provide a valid email address'
  }),
  phone: Joi.string().max(50).allow('', null),
  company: Joi.string().max(255).allow('', null),
  tags: Joi.array().items(Joi.string()).default([]),
  notes: Joi.string().max(1000).allow('', null)
});

const leadSchema = Joi.object({
  title: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Title must be at least 2 characters long',
    'string.max': 'Title cannot exceed 255 characters',
    'any.required': 'Title is required'
  }),
  description: Joi.string().max(2000).allow('', null),
  stage: Joi.string().valid('lead', 'qualified', 'proposal', 'closed').default('lead'),
  value: Joi.number().min(0).allow(null),
  customerId: Joi.number().integer().allow(null),
  assignedTo: Joi.number().integer().allow(null)
});

const taskSchema = Joi.object({
  title: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Title must be at least 2 characters long',
    'string.max': 'Title cannot exceed 255 characters',
    'any.required': 'Title is required'
  }),
  description: Joi.string().max(1000).allow('', null),
  status: Joi.string().valid('pending', 'in-progress', 'completed').default('pending'),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  dueDate: Joi.date().allow(null),
  assignedTo: Joi.number().integer().allow(null),
  customerId: Joi.number().integer().allow(null)
});

const interactionSchema = Joi.object({
  customerId: Joi.number().integer().required().messages({
    'any.required': 'Customer is required'
  }),
  type: Joi.string().valid('call', 'email', 'meeting', 'note').required().messages({
    'any.required': 'Interaction type is required'
  }),
  notes: Joi.string().max(2000).allow('', null),
  date: Joi.date().default(Date.now)
});

const updateLeadStageSchema = Joi.object({
  stage: Joi.string().valid('lead', 'qualified', 'proposal', 'closed').required().messages({
    'any.required': 'Stage is required'
  })
});

const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'in-progress', 'completed').required().messages({
    'any.required': 'Status is required'
  })
});

module.exports = {
  validate,
  loginSchema,
  registerSchema,
  customerSchema,
  leadSchema,
  taskSchema,
  interactionSchema,
  updateLeadStageSchema,
  updateTaskStatusSchema
}; 