const Joi = require('joi');

/**
 * Validation schema for trip search
 */
const searchTripSchema = Joi.object({
  origin: Joi.string().trim().min(1).max(100),
  destination: Joi.string().trim().min(1).max(100),
  busType: Joi.alternatives().try(
    Joi.string().valid('standard', 'limousine', 'sleeper'),
    Joi.array().items(Joi.string().valid('standard', 'limousine', 'sleeper'))
  ),
  departureTime: Joi.alternatives().try(
    Joi.string().valid('morning', 'afternoon', 'evening', 'night'),
    Joi.array().items(Joi.string().valid('morning', 'afternoon', 'evening', 'night'))
  ),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  operatorId: Joi.string().trim(),
  amenities: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ),
  passengers: Joi.number().integer().min(1).max(50),
  sortBy: Joi.string().valid('price', 'time', 'duration').default('time'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

/**
 * Validation schema for trip ID
 */
const tripIdSchema = Joi.object({
  tripId: Joi.string().trim().required()
});

module.exports = {
  searchTripSchema,
  tripIdSchema
};
