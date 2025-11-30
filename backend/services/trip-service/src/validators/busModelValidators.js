// validators/busModelValidators.js
const Joi = require('joi');

// Schema cho layout ghế (ví dụ cấu trúc phổ biến trong hệ thống đặt vé xe)
const seatLayoutSchema = Joi.object({
  floors: Joi.number().integer().min(1).max(2).default(1),
  rows: Joi.number().integer().min(1).max(20).required(),
  columns: Joi.number().integer().min(1).max(6).required(),
  seats: Joi.array().items(
    Joi.object({
      seat_number: Joi.string().pattern(/^[A-Z0-9]{1,4}$/).required(),
      row: Joi.number().integer().min(0).required(),
      col: Joi.number().integer().min(0).required(),
      type: Joi.string().valid('normal', 'vip', 'sleeper', 'empty').default('normal'),
      is_available: Joi.boolean().default(true),
      price_multiplier: Joi.number().min(0.5).max(3).default(1),
    })
  ).required(),
  total_seats: Joi.number().integer().min(1).required(),
}).unknown(false); // Không cho phép field lạ

const createBusModelSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50).required()
    .messages({
      'string.empty': 'Bus model name is required',
      'string.min': 'Name must be at least 3 characters long',
    }),
  total_seats: Joi.number().integer().min(12).max(60).required()
    .messages({
      'number.min': 'Total seats must be at least 12',
      'number.max': 'Total seats cannot exceed 60',
    }),
});

const updateBusModelSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50).optional(),
  total_seats: Joi.number().integer().min(12).max(60).optional(),
});

const setSeatLayoutSchema = Joi.object({
  layout_json: seatLayoutSchema.required()
    .messages({
      'any.required': 'Seat layout is required',
      'object.base': 'layout_json must be a valid JSON object',
    }),
});

module.exports = {
  createBusModelSchema,
  updateBusModelSchema,
  setSeatLayoutSchema,
};