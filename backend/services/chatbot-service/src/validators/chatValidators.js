const Joi = require('joi');

/**
 * Validation schema for chatbot query
 */
const chatQuerySchema = Joi.object({
  sessionId: Joi.string().optional(),
  message: Joi.string().required().min(1).max(1000),
  context: Joi.object({
    userId: Joi.string().optional().allow(null),
    previousMessages: Joi.array().items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant', 'system').required(),
        content: Joi.string().required(),
      })
    ).optional(),
  }).optional(),
});

/**
 * Validation schema for chatbot booking
 */
const chatBookingSchema = Joi.object({
  sessionId: Joi.string().required(),
  tripId: Joi.string().required(),
  seats: Joi.array().items(Joi.string()).min(1).required(),
  passengerInfo: Joi.object({
    fullName: Joi.string().required().min(2).max(100),
    documentId: Joi.string().required().min(9).max(20),
    phone: Joi.string().required().pattern(/^(\+84|84|0)[0-9]{9,10}$/),
    email: Joi.string().email().optional(),
  }).required(),
});

/**
 * Validation schema for session ID parameter
 */
const sessionIdSchema = Joi.object({
  sessionId: Joi.string().required(),
});

/**
 * Validation schema for feedback
 */
const feedbackSchema = Joi.object({
  sessionId: Joi.string().required(),
  messageId: Joi.string().required(),
  rating: Joi.string().valid('positive', 'negative').required(),
  comment: Joi.string().optional().max(500),
});

module.exports = {
  chatQuerySchema,
  chatBookingSchema,
  sessionIdSchema,
  feedbackSchema,
};
