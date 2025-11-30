// validators/routeValidators.js
const Joi = require('joi');

const createRouteSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Route name is required',
    'string.min': 'Route name must be at least 3 characters',
  }),

  origin: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Origin is required',
  }),

  destination: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Destination is required',
  }),
})
.custom((value, helpers) => {
  if (value.origin.toLowerCase() === value.destination.toLowerCase()) {
    return helpers.error('any.invalid', { message: 'Origin and destination cannot be the same' });
  }
  return value;
});


const updateRouteSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  origin: Joi.string().trim().min(2).max(100).optional(),
  destination: Joi.string().trim().min(2).max(100).optional(),
})
.min(1)
.custom((value, helpers) => {
  const { origin, destination } = value;

  if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
    return helpers.error('any.invalid', { message: 'Origin and destination cannot be the same' });
  }

  return value;
});


const addStopSchema = Joi.object({
  stop_name: Joi.string().trim().min(2).max(100).required(),
  sequence: Joi.number().integer().min(1).required(),
  arrival_offset_minutes: Joi.number().integer().min(0).optional().default(0),
  departure_offset_minutes: Joi.number().integer().min(0).optional().default(0),
})
.messages({
  'any.required': '{{#label}} is required',
  'number.base': '{{#label}} must be a number',
});

module.exports = {
  createRouteSchema,
  updateRouteSchema,
  addStopSchema,
};
