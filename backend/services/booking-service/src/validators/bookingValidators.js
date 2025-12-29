const Joi = require('joi');

/**
 * Validation schema for creating a booking
 */
const createBookingSchema = Joi.object({
  tripId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid trip ID format',
    'any.required': 'Trip ID is required',
  }),

  seats: Joi.array()
    .items(Joi.string().pattern(/^((VIP\d{1,2}[A-Z])|([A-Z]\d{1,2}|\d{1,2}[A-Z]))$/))
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'At least one seat must be selected',
      'array.max': 'Cannot book more than 10 seats at once',
      'string.pattern.base': 'Invalid seat code format (e.g., A1, B2, 1A, 2B, VIP2C)',
      'any.required': 'Seats are required',
    }),

  passengers: Joi.array()
    .items(
      Joi.object({
        fullName: Joi.string().min(2).max(100).required().messages({
          'string.min': 'Passenger name must be at least 2 characters',
          'string.max': 'Passenger name cannot exceed 100 characters',
          'any.required': 'Passenger name is required',
        }),

        phone: Joi.string()
          .pattern(/^(\+84|0)[0-9]{9,10}$/)
          .optional()
          .messages({
            'string.pattern.base': 'Invalid Vietnamese phone number format',
          }),

        documentId: Joi.string()
          .pattern(/^[0-9]{9,12}$/)
          .optional()
          .messages({
            'string.pattern.base': 'Document ID must be 9-12 digits',
          }),

        email: Joi.string()
          .email()
          .optional()
          .allow(null, '')
          .messages({
            'string.email': 'Invalid email format',
          }),

        seatCode: Joi.string()
          .pattern(/^((VIP\d{1,2}[A-Z])|([A-Z]\d{1,2}|\d{1,2}[A-Z]))$/)
          .required()
          .messages({
            'string.pattern.base': 'Invalid seat code format (e.g., A1, B2, 1A, 2B, VIP2C)',
            'any.required': 'Seat code is required for each passenger',
          }),
      })
    )
    .required()
    .custom((passengers, helpers) => {
      // Check that number of passengers matches number of seats
      const seatCodes = passengers.map((p) => p.seatCode);
      const uniqueSeats = new Set(seatCodes);

      if (seatCodes.length !== uniqueSeats.size) {
        return helpers.error('passengers.duplicate');
      }

      return passengers;
    })
    .messages({
      'passengers.duplicate': 'Each passenger must have a unique seat',
      'any.required': 'Passenger information is required',
    }),

  contactEmail: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Contact email is required',
  }),

  contactPhone: Joi.string()
    .pattern(/^(\+84|0)[0-9]{9,10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Vietnamese phone number format',
      'any.required': 'Contact phone is required',
    }),

  isGuestCheckout: Joi.boolean().optional().default(false),
})
  .custom((value, helpers) => {
    // Validate that seats array matches passengers array
    if (value.seats.length !== value.passengers.length) {
      return helpers.error('booking.seatPassengerMismatch');
    }

    // Validate that all seat codes in passengers exist in seats array
    const seatSet = new Set(value.seats);
    const allSeatsValid = value.passengers.every((p) => seatSet.has(p.seatCode));

    if (!allSeatsValid) {
      return helpers.error('booking.invalidPassengerSeat');
    }

    return value;
  })
  .messages({
    'booking.seatPassengerMismatch': 'Number of seats must match number of passengers',
    'booking.invalidPassengerSeat': 'Passenger seat codes must be in the selected seats list',
  });

/**
 * Validation schema for updating booking status
 */
const updateBookingStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed').required().messages({
    'any.only': 'Status must be one of: pending, confirmed, cancelled, completed',
    'any.required': 'Status is required',
  }),
});

/**
 * Validation schema for cancelling a booking
 */
const cancelBookingSchema = Joi.object({
  reason: Joi.string().min(5).max(500).optional().messages({
    'string.min': 'Cancellation reason must be at least 5 characters',
    'string.max': 'Cancellation reason cannot exceed 500 characters',
  }),

  requestRefund: Joi.boolean().optional().default(true),
});

/**
 * Validation schema for confirming payment
 */
const confirmPaymentSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
  paymentMethod: Joi.string()
    .valid('momo', 'zalopay', 'vnpay', 'card', 'cash', 'payos')
    .required()
    .messages({
      'any.only': 'Invalid payment method',
      'any.required': 'Payment method is required',
    }),
  transactionRef: Joi.string().optional(),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required',
  }),
});

/**
 * Validation schema for query parameters
 */
const getBookingsQuerySchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'cancelled', 'completed', 'all')
    .optional()
    .default('all'),

  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().min(Joi.ref('fromDate')).optional().messages({
    'date.min': 'To date must be after from date',
  }),

  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(100).optional().default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),

  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'totalPrice')
    .optional()
    .default('createdAt'),

  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
});

/**
 * Validation schema for guest booking lookup
 */
const guestLookupSchema = Joi.object({
  bookingReference: Joi.string()
    .pattern(/^[A-Z]{2}\d{11}$/i)
    .required()
    .messages({
      'string.pattern.base':
        'Booking reference must be in format: BKYYYYMMDDXXX (e.g., BK20251209001)',
      'any.required': 'Booking reference is required',
    }),

  phone: Joi.string()
    .pattern(/^(\+84|0)[0-9]{9,10}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid Vietnamese phone number format',
    }),

  email: Joi.string().email().optional().messages({
    'string.email': 'Invalid email format',
  }),
})
  .or('phone', 'email')
  .messages({
    'object.missing': 'Either phone or email must be provided',
  });

module.exports = {
  createBookingSchema,
  updateBookingStatusSchema,
  cancelBookingSchema,
  confirmPaymentSchema,
  getBookingsQuerySchema,
  guestLookupSchema,
};
