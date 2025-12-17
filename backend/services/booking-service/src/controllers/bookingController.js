const bookingService = require('../services/bookingService');
const { mapToBooking } = require('../utils/helpers');
const {
  createBookingSchema,
  cancelBookingSchema,
  confirmPaymentSchema,
  getBookingsQuerySchema,
  guestLookupSchema,
} = require('../validators/bookingValidators');

class BookingController {
  /**
   * Create a new booking
   * POST /bookings
   */
  async create(req, res) {
    try {
      // Validate request body
      const { error, value } = createBookingSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
        });
      }

      // Get user ID from auth (null for guest checkout)
      // Handle both userId (camelCase) and user_id (snake_case) from JWT
      const userId = req.user?.userId || req.user?.user_id || null;

      console.log('[BookingController] create called');
      console.log('[BookingController] req.user:', JSON.stringify(req.user, null, 2));
      console.log('[BookingController] extracted userId:', userId);
      console.log('[BookingController] booking data:', JSON.stringify(value, null, 2));

      // Create booking
      const booking = await bookingService.createBooking(value, userId);

      return res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created successfully. Please complete payment within 10 minutes.',
      });
    } catch (err) {
      console.error('Error creating booking:', err);

      if (err.message.includes('already booked')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BOOK_001',
            message: err.message,
          },
        });
      }

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: err.message,
          },
        });
      }

      if (err.message.includes('BOOKING_REFERENCE_GENERATION_FAILED')) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'BOOK_003',
            message: 'Unable to generate unique booking reference. Please try again.',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to create booking',
        },
      });
    }
  }

  /**
   * Get booking by ID
   * GET /bookings/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || req.user?.user_id || null;

      const booking = await bookingService.getBookingById(id, userId);

      return res.json({
        success: true,
        data: booking,
      });
    } catch (err) {
      console.error('Error getting booking:', err);

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found',
          },
        });
      }

      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'Unauthorized to view this booking',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve booking',
        },
      });
    }
  }

  /**
   * Get booking by reference (for guest checkout)
   * GET /bookings/reference/:reference
   */
  async getByReference(req, res) {
    try {
      const { reference } = req.params;
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Email parameter is required',
          },
        });
      }

      const booking = await bookingService.getBookingByReference(reference, email);

      return res.json({
        success: true,
        data: booking,
      });
    } catch (err) {
      console.error('Error getting booking by reference:', err);

      if (err.message.includes('not found') || err.message.includes('Invalid')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found or invalid credentials',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve booking',
        },
      });
    }
  }

  /**
   * Guest booking lookup (accepts phone OR email)
   * GET /bookings/guest/lookup
   * Query params: bookingReference (required), phone OR email (one required)
   */
  async guestLookup(req, res) {
    try {
      // Validate query parameters
      const { error, value } = guestLookupSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { bookingReference, phone, email } = value;

      // Lookup booking with phone or email verification
      const booking = await bookingService.guestLookupBooking(bookingReference, phone, email);

      // Booking is already formatted by repository layer
      return res.json({
        success: true,
        data: booking,
        message: 'Booking retrieved successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error in guest booking lookup:', err);

      // Handle specific error cases
      if (err.message === 'BOOKING_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found with the provided reference',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err.message === 'CONTACT_MISMATCH') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message:
              'Contact information does not match booking records. Please verify your phone number or email.',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Generic error
      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve booking',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get user's bookings with pagination and filters
   * GET /bookings
   */
  async getUserBookings(req, res) {
    try {
      const userId = req.user?.userId || req.user?.user_id;

      console.log('[BookingController] getUserBookings called');
      console.log('[BookingController] userId:', userId);
      console.log('[BookingController] Query params:', req.query);

      // Validate query parameters
      const { error, value } = getBookingsQuerySchema.validate(req.query);
      if (error) {
        console.error('[BookingController] Validation error:', error.details);
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
        });
      }

      console.log('[BookingController] Validated filters:', value);

      const result = await bookingService.getUserBookings(userId, value);

      console.log(`[BookingController] Returning ${result.bookings.length} bookings`);

      return res.json({
        success: true,
        data: result.bookings,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error('Error getting user bookings:', err);

      // Handle old JWT token error
      if (err.message.includes('OLD_JWT_TOKEN_DETECTED')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_004',
            message: 'Your session is outdated. Please logout and login again to continue.',
            action: 'FORCE_LOGOUT',
          },
        });
      }

      // Handle invalid user ID
      if (err.message.includes('INVALID_USER_ID')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VAL_002',
            message: 'Invalid user ID format',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve bookings',
        },
      });
    }
  }

  /**
   * Confirm payment for a booking
   * POST /bookings/:id/confirm-payment
   */
  async confirmPayment(req, res) {
    try {
      const { id } = req.params;

      // Validate request body
      const { error, value } = confirmPaymentSchema.validate({
        ...req.body,
        bookingId: id,
      });

      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
        });
      }

      const userId = req.user?.userId || req.user?.user_id || null;
      const booking = await bookingService.confirmPayment(id, value, userId);

      return res.json({
        success: true,
        data: booking,
        message: 'Payment confirmed successfully',
      });
    } catch (err) {
      console.error('Error confirming payment:', err);

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found',
          },
        });
      }

      if (err.message.includes('cancelled') || err.message.includes('already paid')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BOOK_003',
            message: err.message,
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to confirm payment',
        },
      });
    }
  }

  /**
   * Get cancellation policy preview
   * GET /bookings/:id/cancellation-preview
   */
  async getCancellationPreview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || req.user?.user_id || null;

      const preview = await bookingService.getCancellationPreview(id, userId);

      return res.json({
        success: true,
        data: preview,
        message: 'Cancellation preview retrieved successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error getting cancellation preview:', err);

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'Unauthorized to view this booking',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve cancellation preview',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Cancel a booking with refund processing
   * PUT /bookings/:id/cancel
   */
  async cancel(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || req.user?.user_id || null;

      // Validate request body
      const { error, value } = cancelBookingSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await bookingService.cancelBooking(id, userId, value);

      return res.json({
        success: true,
        data: result,
        message: 'Booking cancelled successfully. Refund will be processed within 3-5 business days.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error cancelling booking:', err);

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'Unauthorized to cancel this booking',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err.message.includes('already cancelled') || err.message.includes('Cannot cancel')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BOOK_004',
            message: err.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to cancel booking',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Admin: Get all bookings with filters
   * GET /admin/bookings
   */
  async getAllBookings(req, res) {
    try {
      // Validate query parameters
      // Validate query parameters
      const { error, value } = getBookingsQuerySchema.validate(req.query);
      if (error) {
        console.error('[BookingController] Validation error:', error.details);
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
        });
      }

      // TODO: Implement admin get all bookings with validated filters
      console.log('[BookingController] Admin getAllBookings - filters:', value);

      return res.json({
        success: true,
        data: [],
        message: 'Admin endpoint - to be implemented',
      });
    } catch (err) {
      console.error('Error getting all bookings:', err);

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve bookings',
        },
      });
    }
  }

  /**
   * Share ticket via email
   * POST /bookings/:bookingReference/share
   */
  async shareTicket(req, res) {
    try {
      const { bookingReference } = req.params;
      const { email, phone } = req.body;

      if (!email) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Email is required',
          },
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Invalid email format',
          },
        });
      }

      const result = await bookingService.shareTicket(bookingReference, email, phone);

      return res.json({
        success: true,
        message: 'Ticket shared successfully',
        data: result,
      });
    } catch (err) {
      console.error('Error sharing ticket:', err);

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found',
          },
        });
      }

      if (err.message.includes('not confirmed')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BOOK_004',
            message: 'Only confirmed bookings can be shared',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to share ticket',
        },
      });
    }
  }

  /**
   * Health check endpoint
   * GET /health
   */
  async healthCheck(req, res) {
    return res.json({
      status: 'healthy',
      service: 'booking-service',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get modification policy preview
   * GET /bookings/:id/modification-preview
   */
  async getModificationPreview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || req.user?.user_id || null;

      const preview = await bookingService.getModificationPreview(id, userId);

      return res.json({
        success: true,
        data: preview,
        message: 'Modification preview retrieved successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error getting modification preview:', err);

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'Unauthorized to view this booking',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve modification preview',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Modify a booking (update passenger info or change seats)
   * PUT /bookings/:id/modify
   */
  async modifyBooking(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || req.user?.user_id || null;

      // Validate request body
      const modifications = req.body;

      if (!modifications.passengerUpdates && !modifications.seatChanges) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'At least one modification (passengerUpdates or seatChanges) is required',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await bookingService.modifyBooking(id, userId, modifications);

      return res.json({
        success: true,
        data: result,
        message: 'Booking modified successfully. Updated e-ticket has been sent to your email.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error modifying booking:', err);

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'Unauthorized to modify this booking',
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (err.message.includes('not available') || err.message.includes('not allowed')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BOOK_005',
            message: err.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to modify booking',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new BookingController();
