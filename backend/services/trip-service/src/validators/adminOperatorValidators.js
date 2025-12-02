// validators/adminOperatorValidators.js
const Joi = require('joi');

const approveSchema = Joi.object({
  approved: Joi.boolean().required(),
  notes: Joi.string().max(500).optional().allow(''),
});

const listQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'suspended').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { approveSchema, listQuerySchema };