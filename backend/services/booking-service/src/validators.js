const Joi = require('joi');

const createBookingSchema = Joi.object({
  tripId: Joi.string().required(),
  isGuestCheckout: Joi.boolean().default(false),
  contactEmail: Joi.string().email().optional().allow(''),
  contactPhone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().allow(''),
  passengers: Joi.array().items(
    Joi.object({
      fullName: Joi.string().required(),
      documentType: Joi.string().valid('CITIZEN_ID', 'PASSPORT', 'DRIVING_LICENSE').optional().allow(''),
      documentId: Joi.string().optional().allow(''),
      phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().allow(''),
      seatNumber: Joi.string().required()
    })
  ).min(1).required(),
  paymentMethod: Joi.string().valid('momo', 'zalopay', 'card', 'cash').optional(),
  totalPrice: Joi.number().positive().required()
}).custom((value, helpers) => {
  // Ensure both email AND phone are provided for guest checkout
  if (value.isGuestCheckout && (!value.contactEmail || !value.contactPhone)) {
    return helpers.error('any.custom', {
      message: 'Both contactEmail and contactPhone are required for guest checkout'
    });
  }
  return value;
});

const bookingLookupSchema = Joi.object({
  bookingReference: Joi.string().required(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional()
}).or('contactEmail', 'contactPhone');

module.exports = {
  createBookingSchema,
  bookingLookupSchema
};
