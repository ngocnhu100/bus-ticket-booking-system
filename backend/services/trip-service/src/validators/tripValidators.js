const Joi = require('joi');

const createTripSchema = Joi.object({
  route_id: Joi.string().uuid().required(),
  bus_id: Joi.string().uuid().required(),
  departure_time: Joi.date().iso().required(),
  arrival_time: Joi.date().iso().required(),
  base_price: Joi.number().positive().required(),
});

const updateTripSchema = Joi.object({
  departure_time: Joi.date().iso().optional(),
  arrival_time: Joi.date().iso().optional(),
  base_price: Joi.number().positive().optional(),
  bus_id: Joi.string().uuid().optional(),
  status: Joi.string().valid('scheduled', 'cancelled', 'completed').optional()
});

const searchTripSchema = Joi.object({
  origin: Joi.string().optional(),
  destination: Joi.string().optional(),
  date: Joi.date().optional(),
  priceMin: Joi.number().optional(),
  priceMax: Joi.number().optional(),
  departureStart: Joi.date().iso().optional(),
  departureEnd: Joi.date().iso().optional(),
  busModel: Joi.string().optional(),
  minSeats: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  sort: Joi.string().valid('price ASC', 'price DESC', 'departure_time ASC', 'departure_time DESC').default('departure_time ASC'),
});

module.exports = { createTripSchema, updateTripSchema, searchTripSchema };