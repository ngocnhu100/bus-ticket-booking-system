// validators/routeValidators.js
const Joi = require('joi');

// UUID pattern chuẩn
const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const createRouteSchema = Joi.object({
  operator_id: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.pattern.base': 'operator_id must be a valid UUID',
      'any.required': 'operator_id is required'
    }),

  origin: Joi.string().trim().min(2).max(100).required()
    .messages({
      'any.required': 'origin is required',
      'string.empty': 'origin cannot be empty'
    }),

  destination: Joi.string().trim().min(2).max(100).required()
    .messages({
      'any.required': 'destination is required',
      'string.empty': 'destination cannot be empty'
    }),

  distance_km: Joi.number().integer().min(1).max(5000).required()
    .messages({
      'number.base': 'distance_km must be a number',
      'any.required': 'distance_km is required',
      'number.min': 'distance_km must be at least 1'
    }),

  estimated_minutes: Joi.number().integer().min(10).max(10080).required()
    .messages({
      'number.base': 'estimated_minutes must be a number',
      'any.required': 'estimated_minutes is required',
      'number.min': 'estimated_minutes must be at least 10 minutes'
    })
})
.custom((value, helpers) => {
  if (value.origin.trim().toLowerCase() === value.destination.trim().toLowerCase()) {
    return helpers.error('any.invalid', { 
      message: 'Origin and destination cannot be the same' 
    });
  }
  return value;
})
.messages({
  'object.unknown': 'Field "{{#label}}" is not allowed'
});

const updateRouteSchema = Joi.object({
  origin: Joi.string().trim().min(2).max(100).optional(),
  destination: Joi.string().trim().min(2).max(100).optional(),
  distance_km: Joi.number().integer().min(1).max(5000).optional(),
  estimated_minutes: Joi.number().integer().min(10).max(10080).optional()
})
.min(1) // ít nhất phải có 1 field để update
.custom((value, helpers) => {
  if (value.origin && value.destination && 
      value.origin.trim().toLowerCase() === value.destination.trim().toLowerCase()) {
    return helpers.error('any.invalid', { 
      message: 'Origin and destination cannot be the same' 
    });
  }
  return value;
});

// Cập nhật addStopSchema để hỗ trợ đầy đủ FE interface
const addStopSchema = Joi.object({
  stop_name: Joi.string().trim().min(2).max(100).required()
    .messages({
      'any.required': 'stop_name is required',
      'string.empty': 'stop_name cannot be empty'
    }),

  address: Joi.string().max(255).optional().allow('').default(''),

  sequence: Joi.number().integer().min(1).max(1000).required()
    .messages({
      'any.required': 'sequence is required',
      'number.base': 'sequence must be a number'
    }),

  estimated_time_offset: Joi.number().integer().min(0).max(1440).optional().default(0),

  is_pickup: Joi.boolean().default(true),
  is_dropoff: Joi.boolean().default(true)
})
.messages({
  'object.unknown': 'Field "{{#label}}" is not allowed'
});

module.exports = {
  createRouteSchema,
  updateRouteSchema,
  addStopSchema,
};