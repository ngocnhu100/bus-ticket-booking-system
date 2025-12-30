// validators/tripValidators.js
const Joi = require('joi');

const policies_schema = Joi.object({
  cancellation_policy: Joi.string().allow('').required(),
  modification_policy: Joi.string().allow('').required(),
  refund_policy: Joi.string().allow('').required(),
});

const create_trip_schema = Joi.object({
  route_id: Joi.string().uuid().required(),
  bus_id: Joi.string().uuid().required(),
  departure_time: Joi.date().iso().required(),
  arrival_time: Joi.date().iso().required().greater(Joi.ref('departure_time')),
  base_price: Joi.number().positive().required(),
  policies: policies_schema.optional().default({
    cancellation_policy: 'Standard cancellation',
    modification_policy: 'Flexible',
    refund_policy: 'Refundable up to 24h',
  }),
  status: Joi.string().optional().default('scheduled'),
});

// Admin create schema (for admin trip form)
const admin_create_trip_schema = Joi.object({
  route_id: Joi.string().uuid().required(),
  bus_id: Joi.string().uuid().required(),
  operator_id: Joi.string().uuid().optional(),
  departure_time: Joi.date().iso().required(),
  arrival_time: Joi.alternatives()
    .try(
      Joi.date().iso(),
      Joi.string().valid('') // Allow empty string
    )
    .optional(),
  base_price: Joi.number().min(0).required(),
  service_fee: Joi.number().min(0).optional().default(0),
  policies: policies_schema.optional().default({
    cancellation_policy: 'Standard cancellation',
    modification_policy: 'Flexible',
    refund_policy: 'Refundable up to 24h',
  }),
  status: Joi.string().optional().default('scheduled'),
});

// Admin update schema (for admin trip form)
const admin_update_trip_schema = Joi.object({
  route_id: Joi.string().uuid().optional(),
  bus_id: Joi.string().uuid().optional(),
  departure_time: Joi.date().iso().optional(),
  arrival_time: Joi.alternatives()
    .try(
      Joi.date().iso(),
      Joi.string().valid('') // Allow empty string
    )
    .optional(),
  base_price: Joi.number().min(0).optional(),
  service_fee: Joi.number().min(0).optional(),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
  policies: policies_schema.optional(),
});

const update_trip_schema = Joi.object({
  departure_time: Joi.date().iso().optional(),
  arrival_time: Joi.date().iso().optional(),
  base_price: Joi.number().positive().optional(),
  bus_id: Joi.string().uuid().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  policies: policies_schema.optional(),
});

const search_trip_schema = Joi.object({
  // Basic search params
  origin: Joi.string().trim().min(1).max(100),
  destination: Joi.string().trim().min(1).max(100),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  passengers: Joi.number().integer().min(1).max(50),

  // Filter params
  departureTime: Joi.custom((value, helpers) => {
    let arr;
    if (Array.isArray(value)) {
      arr = value;
    } else if (typeof value === 'string') {
      arr = value.split(',').map((s) => s.trim());
    } else {
      return helpers.error('any.invalid');
    }
    // Validate each item
    for (const item of arr) {
      if (!['morning', 'afternoon', 'evening', 'night'].includes(item)) {
        return helpers.error('any.invalid');
      }
    }
    return arr;
  }),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  operator: Joi.custom((value, helpers) => {
    if (Array.isArray(value)) {
      return value.map((s) => s.trim());
    } else if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    } else {
      return helpers.error('any.invalid');
    }
  }),
  busType: Joi.custom((value, helpers) => {
    let arr;
    if (Array.isArray(value)) {
      arr = value;
    } else if (typeof value === 'string') {
      arr = value.split(',').map((s) => s.trim());
    } else {
      return helpers.error('any.invalid');
    }
    // Validate each item
    for (const item of arr) {
      if (!['standard', 'limousine', 'sleeper'].includes(item)) {
        return helpers.error('any.invalid');
      }
    }
    return arr;
  }),
  amenity: Joi.custom((value, helpers) => {
    if (Array.isArray(value)) {
      return value.map((s) => s.trim());
    } else if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    } else {
      return helpers.error('any.invalid');
    }
  }),
  seatLocation: Joi.alternatives().try(
    Joi.string().valid('window', 'aisle'),
    Joi.string().regex(/^(window|aisle)(,(window|aisle))*$/),
    Joi.array().items(Joi.string().valid('window', 'aisle'))
  ),
  minRating: Joi.number().min(0).max(5),
  minSeats: Joi.number().integer().min(0),

  // Flexible search
  flexibleDays: Joi.number().integer().min(1).max(30).default(7),
  direction: Joi.string().valid('next', 'previous').default('next'),

  // Sort and pagination
  sort: Joi.string().default('default'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

module.exports = {
  create_trip_schema,
  update_trip_schema,
  search_trip_schema,
  admin_create_trip_schema,
  admin_update_trip_schema,
};
