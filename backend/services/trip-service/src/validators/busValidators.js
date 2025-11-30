const Joi = require('joi');

const createBusSchema = Joi.object({
  license_plate: Joi.string().pattern(/^[0-9]{2}[A-Z]-[0-9]{3}\.[0-9]{2}$/).required()
    .messages({ 'string.pattern.base': 'Biển số không đúng định dạng (VD: 51B-123.45)' }),
  bus_model_id: Joi.number().integer().required(),
  amenities: Joi.object().default({}),
  status: Joi.string().valid('active', 'maintenance', 'inactive').default('active')
});

const updateBusSchema = createBusSchema.fork(['license_plate', 'bus_model_id'], field => field.optional());

module.exports = { createBusSchema, updateBusSchema };