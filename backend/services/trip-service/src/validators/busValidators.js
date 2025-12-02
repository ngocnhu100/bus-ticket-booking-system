// validators/busValidators.js
const Joi = require('joi');

// Danh sách tiện ích hợp lệ (có thể mở rộng)
const VALID_AMENITIES = [
  'wifi', 'toilet', 'ac', 'tv', 'blanket', 
  'water', 'usb', 'reading_light', 'entertainment', 
  'massage', 'pillow'
];

const createBusSchema = Joi.object({
  operator_id: Joi.string().uuid().required()
    .messages({ 'any.required': 'operator_id là bắt buộc' }),

  bus_model_id: Joi.string().uuid().required()
    .messages({ 'any.required': 'bus_model_id là bắt buộc' }),

  license_plate: Joi.string()
    .pattern(/^[0-9]{2}[A-Z]-[0-9]{3}\.[0-9]{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Biển số không đúng định dạng (VD: 51B-123.45)',
      'any.required': 'Biển số xe là bắt buộc'
    }),

  plate_number: Joi.string().max(20).optional().allow(null, ''),

  type: Joi.string()
    .valid('standard', 'limousine', 'sleeper')
    .default('standard'),

  amenities: Joi.array().items(Joi.string().valid(...VALID_AMENITIES)).default([]),

  status: Joi.string()
    .valid('active', 'maintenance', 'retired')
    .default('active'),

  image_url: Joi.string().uri().max(255).optional().allow(null, '') // New: validate as URL
});

const updateBusSchema = Joi.object({
  type: Joi.string()
    .valid('standard', 'limousine', 'sleeper')
    .optional(),

  amenities: Joi.array().items(Joi.string().valid(...VALID_AMENITIES)).optional(),

  status: Joi.string()
    .valid('active', 'maintenance', 'retired')
    .optional(),

  plate_number: Joi.string().max(20).optional().allow(null, ''),

  image_url: Joi.string().uri().max(255).optional().allow(null, ''),
  
  // Cấm update các trường định danh
  operator_id: Joi.forbidden(),
  bus_model_id: Joi.forbidden(),
  license_plate: Joi.forbidden()
});

module.exports = { createBusSchema, updateBusSchema };