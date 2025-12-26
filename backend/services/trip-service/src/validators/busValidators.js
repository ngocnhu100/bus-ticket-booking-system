// validators/busValidators.js
const Joi = require('joi');

// Danh sách tiện ích hợp lệ (có thể mở rộng)
const VALID_AMENITIES = [
  'wifi',
  'toilet',
  'ac',
  'tv',
  'blanket',
  'water',
  'usb',
  'reading_light',
  'entertainment',
  'massage',
  'pillow',
];

const createBusSchema = Joi.object({
  operator_id: Joi.string()
    .uuid()
    .required()
    .messages({ 'any.required': 'operator_id là bắt buộc' }),

  name: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({ 'any.required': 'Tên xe (name) là bắt buộc' }),

  model: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({ 'any.required': 'Model xe là bắt buộc' }),

  plate_number: Joi.string()
    .pattern(/^[0-9]{2}[A-Z]-[0-9]{3}\.[0-9]{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Biển số không đúng định dạng (VD: 51B-123.45)',
      'any.required': 'Biển số xe là bắt buộc',
    }),

  type: Joi.string().valid('standard', 'limousine', 'sleeper').default('standard'),

  capacity: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .required()
    .messages({ 'any.required': 'Sức chứa (capacity) là bắt buộc' }),

  amenities: Joi.array()
    .items(Joi.string().valid(...VALID_AMENITIES))
    .default([]),

  status: Joi.string().valid('active', 'inactive', 'maintenance').default('active'),

  image_urls: Joi.array().items(Joi.string().uri().max(255)).default([]),
});

const updateBusSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  model: Joi.string().trim().max(100).optional(),
  plate_number: Joi.string()
    .pattern(/^[0-9]{2}[A-Z]-[0-9]{3}\.[0-9]{2}$/)
    .optional(),
  type: Joi.string().valid('standard', 'limousine', 'sleeper').optional(),
  capacity: Joi.number().integer().min(1).max(100).optional(),
  amenities: Joi.array()
    .items(Joi.string().valid(...VALID_AMENITIES))
    .optional(),
  status: Joi.string().valid('active', 'inactive', 'maintenance').optional(),
  image_urls: Joi.array().items(Joi.string().uri().max(255)).optional(),

  // Cấm thay đổi operator_id
  operator_id: Joi.forbidden(),
});

module.exports = { createBusSchema, updateBusSchema };
