const Joi = require('joi');

/**
 * Validation schema for passenger information
 * Reusable across booking and chatbot extraction
 */
const passengerSchema = Joi.object({
  fullName: Joi.string().required().min(2).max(100),
  documentId: Joi.string().required().min(9).max(12),
  phone: Joi.string()
    .required()
    .pattern(/^(\+84|84|0)[0-9]{9,10}$/),
  email: Joi.string().email().optional().allow(null),
});

/**
 * Validation schema for chatbot query
 */
const chatQuerySchema = Joi.object({
  sessionId: Joi.string().optional(),
  message: Joi.string().required().min(1).max(1000),
  context: Joi.object({
    userId: Joi.string().optional().allow(null),
    previousMessages: Joi.array()
      .items(
        Joi.object({
          role: Joi.string().valid('user', 'assistant', 'system').required(),
          content: Joi.string().required(),
        })
      )
      .optional(),
  }).optional(),
});

/**
 * Validation schema for chatbot booking
 */
const chatBookingSchema = Joi.object({
  sessionId: Joi.string().required(),
  tripId: Joi.string().required(),
  seats: Joi.array().items(Joi.string()).min(1).required(),
  contactInfo: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string()
      .required()
      .pattern(/^(\+84|84|0)[0-9]{9,10}$/),
  }).required(),
  passengerInfo: Joi.alternatives()
    .try(
      // Single passenger object (reuse passengerSchema)
      passengerSchema,
      // Array of passengers (reuse passengerSchema)
      Joi.array().items(passengerSchema).min(1)
    )
    .required(),
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

/**
 * Validation schema for passenger info form submission
 */
const passengerInfoFormSchema = Joi.object({
  sessionId: Joi.string().required(),
  passengers: Joi.array()
    .items(
      Joi.object({
        seat_code: Joi.string().required(),
        full_name: Joi.string().required().min(2).max(100),
        phone: Joi.string()
          .required()
          .pattern(/^(\+84|84|0)[0-9]{9,10}$/),
        email: Joi.string().email().required(),
        id_number: Joi.string()
          .optional()
          .allow('')
          .pattern(/^[0-9]{9,12}$/),
      })
    )
    .min(1)
    .required(),
});

module.exports = {
  passengerSchema,
  chatQuerySchema,
  chatBookingSchema,
  sessionIdSchema,
  feedbackSchema,
  passengerInfoFormSchema,
};
