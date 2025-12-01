const Joi = require('joi');

/**
 * Validation schema for trip search
 */
const tripSearchSchema = Joi.object({
  origin: Joi.string().required().messages({
    'string.empty': 'Origin is required',
    'any.required': 'Origin is required'
  }),
  destination: Joi.string().required().messages({
    'string.empty': 'Destination is required',
    'any.required': 'Destination is required'
  }),
  date: Joi.string().required().messages({
    'string.empty': 'Date is required',
    'any.required': 'Date is required'
  }),
  passengers: Joi.number().integer().min(1).max(50).optional(),
  busType: Joi.alternatives().try(
    Joi.string().valid('standard', 'limousine', 'sleeper'),
    Joi.array().items(Joi.string().valid('standard', 'limousine', 'sleeper'))
  ).optional(),
  departureTime: Joi.alternatives().try(
    Joi.string().valid('morning', 'afternoon', 'evening', 'night'),
    Joi.array().items(Joi.string().valid('morning', 'afternoon', 'evening', 'night'))
  ).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  operatorId: Joi.string().optional(),
  amenities: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10)
}).custom((value, helpers) => {
  if (value.minPrice && value.maxPrice && value.minPrice > value.maxPrice) {
    return helpers.error('any.invalid', {
      message: 'minPrice cannot be greater than maxPrice'
    });
  }
  return value;
});

/**
 * Validation schema for trip ID parameter
 */
const tripIdSchema = Joi.object({
  tripId: Joi.string().required().messages({
    'string.empty': 'Trip ID is required',
    'any.required': 'Trip ID is required'
  })
});

module.exports = {
  tripSearchSchema,
  tripIdSchema
};
