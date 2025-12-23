// validators/tripValidators.js
const Joi = require('joi');

const policies_schema = Joi.object({
  cancellation_policy: Joi.string().required(),
  modification_policy: Joi.string().required(),
  refund_policy: Joi.string().required(),
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
  status: Joi.string().valid('active', 'inactive').optional().default('active'),
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
  origin: Joi.string().optional(),
  destination: Joi.string().optional(),
  date: Joi.string()
    .regex(/^\d{2}-\d{2}-\d{4}$|^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => {
      const parts = value.split('-');
      let day, month, year;

      if (parts[0].length === 4) {
        // YYYY-MM-DD format
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        // DD-MM-YYYY or MM-DD-YYYY format
        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);

        if (first > 12) {
          // Assume DD-MM-YYYY
          day = first;
          month = second;
        } else {
          // Assume MM-DD-YYYY
          month = first;
          day = second;
        }
      }

      // Validate the date
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return helpers.error('date.invalid');
      }

      // Return the date in YYYY-MM-DD format
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    })
    .optional(),
  passengers: Joi.number().integer().min(1).default(1),
  price_min: Joi.number().min(0).optional(),
  price_max: Joi.number().min(0).optional(),
  departure_start: Joi.date().iso().optional(),
  departure_end: Joi.date().iso().optional(),
  bus_type: Joi.string().valid('standard', 'limousine', 'sleeper').optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  page: Joi.number().integer().min(1).default(1),
  sort: Joi.string()
    .valid('base_price ASC', 'base_price DESC', 'departure_time ASC', 'departure_time DESC')
    .default('departure_time ASC'),
});

module.exports = { create_trip_schema, update_trip_schema, search_trip_schema };
