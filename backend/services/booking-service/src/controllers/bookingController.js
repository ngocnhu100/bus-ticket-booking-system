const bookingService = require('../services/bookingService');
const bookingRepository = require('../repositories/bookingRepository');
const { mapToBooking } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');
const {
  createBookingSchema,
  cancelBookingSchema,
  confirmPaymentSchema,
  getBookingsQuerySchema,
  guestLookupSchema,
} = require('../validators/bookingValidators');

class BookingController {
  /**
   * Idempotent internal confirm-payment endpoint for payment-service webhook
   * POST /internal/:id/confirm-payment
   */
  async internalConfirmPayment(req, res) {
    try {
      const { id } = req.params;
      // Confirm booking and trigger ticket generation (idempotent)
      const confirmedBooking = await bookingService.confirmBooking(id);
      if (!confirmedBooking) {
        return res.status(404).json({
          success: false,
          error: { code: 'BOOKING_003', message: 'Booking not found' },
          timestamp: new Date().toISOString(),
        });
      }
      // If already confirmed, just return success
      if (confirmedBooking.status === 'confirmed' || confirmedBooking.payment_status === 'paid') {
        return res.json({
          success: true,
          message: 'Booking already confirmed',
          timestamp: new Date().toISOString(),
        });
      }
      // Get updated booking with ticket info (may not be available immediately)
      const bookingWithTicket = await bookingService.getBookingById(id);
      res.json({
        success: true,
        data: bookingWithTicket,
        message:
          'Booking confirmed successfully. Ticket is being generated and will be emailed to you shortly.',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️ Internal confirm booking error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }
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
      // Nếu không có token (req.user == null), chỉ cho phép nếu booking là guest
      if (!req.user) {
        const booking = await bookingService.getBookingById(id);
        if (!booking || !booking.is_guest_checkout) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_005',
              message: 'Guest payment only allowed for guest bookings',
            },
          });
        }
      }
      // DEBUG LOG: print all relevant info
      console.log('[BookingController] confirmPayment called');
      console.log('req.body:', req.body);
      console.log('value:', value);
      console.log('value.paymentMethod:', value.paymentMethod);
      const result = await bookingService.confirmPayment(id, value);
      return res.json({
        success: true,
        paymentUrl: result.paymentUrl,
        qrCode: result.qrCode,
        data: result,
        message:
          result.paymentUrl || result.qrCode
            ? 'Thanh toán đã được khởi tạo. Vui lòng quét mã QR hoặc nhấn vào link để thanh toán.'
            : 'Payment confirmed successfully',
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
        message:
          'Booking cancelled successfully. Refund will be processed within 3-5 business days.',
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
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status, // pending, confirmed, cancelled, completed
        payment_status: req.query.payment_status, // unpaid, paid, refunded
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC',
      };

      console.log('[BookingController] Admin getAllBookings with filters:', filters);

      const result = await bookingService.getAllBookingsAdmin(filters);

      return res.json({
        success: true,
        data: result.bookings,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error getting all bookings (admin):', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve bookings',
        },
        timestamp: new Date().toISOString(),
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
   * Serve ticket PDF file by booking reference
   * GET /:bookingReference/ticket
   * Query params (for guests): email or phone
   */
  async serveTicket(req, res) {
    try {
      const { bookingReference } = req.params;
      const { email, phone } = req.query; // For guest verification
      const isAuthenticated = !!req.user; // Check if user is authenticated
      const userId = req.user?.userId || req.user?.user_id;

      console.log(
        '[serveTicket] Request for:',
        bookingReference,
        'isAuthenticated:',
        isAuthenticated,
        'userId:',
        userId,
        'email:',
        email,
        'phone:',
        phone
      );

      // Find booking by reference
      const booking = await bookingRepository.findByReference(bookingReference);
      if (!booking) {
        console.log('[serveTicket] Booking not found:', bookingReference);
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found',
          },
        });
      }

      console.log(
        '[serveTicket] Found booking:',
        booking.booking_reference,
        'status:',
        booking.status,
        'contact_email:',
        booking.contact_email,
        'user_id:',
        booking.user_id
      );

      // Check if booking is confirmed (has ticket)
      if (booking.status !== 'confirmed') {
        console.log('[serveTicket] Booking not confirmed:', booking.status);
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_003',
            message: 'Ticket not available - booking not confirmed',
          },
        });
      }

      // ===== SECURITY CHECK =====
      // Case 1: Authenticated user (has valid JWT token)
      if (isAuthenticated && userId) {
        console.log('[serveTicket] Checking authenticated user ownership');
        // Registered user: Check ownership
        if (booking.user_id !== userId) {
          console.log(
            '[serveTicket] ❌ Ownership check failed: booking.user_id:',
            booking.user_id,
            'userId:',
            userId
          );
          return res.status(403).json({
            success: false,
            error: {
              code: 'AUTH_003',
              message: 'Unauthorized to access this ticket',
            },
          });
        }
        console.log('[serveTicket] ✅ Ownership check passed');
      }
      // Case 2: Guest user (no token) - MUST provide email or phone verification
      else if (!isAuthenticated) {
        console.log('[serveTicket] Guest access - requiring email or phone verification');
        // Guest: Require email or phone verification
        if (!email && !phone) {
          console.log('[serveTicket] ❌ Guest verification failed: no email or phone provided');
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_005',
              message: 'Authentication required. Provide email or phone as query params.',
            },
          });
        }
        // Verify contact info matches booking
        const contactMatch =
          (email && booking.contact_email === email) || (phone && booking.contact_phone === phone);
        if (!contactMatch) {
          console.log(
            '[serveTicket] ❌ Contact verification failed: provided email:',
            email,
            'phone:',
            phone,
            'booking.contact_email:',
            booking.contact_email,
            'booking.contact_phone:',
            booking.contact_phone
          );
          return res.status(403).json({
            success: false,
            error: {
              code: 'AUTH_003',
              message: 'Contact information does not match booking records',
            },
          });
        }
        console.log('[serveTicket] ✅ Contact verification passed');
      }

      console.log('[serveTicket] Security check passed');

      // Get ticket filename from booking data
      let ticketFilename = booking.e_ticket?.filename;
      if (!ticketFilename && booking.ticket_url) {
        // Extract filename from ticket_url: /bookings/tickets/filename.pdf
        const urlMatch = booking.ticket_url.match(/\/bookings\/tickets\/(.+)$/);
        if (urlMatch) {
          ticketFilename = urlMatch[1];
        }
      }
      if (!ticketFilename) {
        // Fallback: try pattern ticket-{reference}-{timestamp}.pdf
        const ticketsDir = path.join(__dirname, '../../tickets');
        if (fs.existsSync(ticketsDir)) {
          const files = fs.readdirSync(ticketsDir);
          const matchingFile = files.find(
            (file) => file.startsWith(`ticket-${bookingReference}-`) && file.endsWith('.pdf')
          );
          if (matchingFile) {
            ticketFilename = matchingFile;
          }
        }
      }
      if (!ticketFilename) {
        ticketFilename = `${bookingReference}.pdf`;
      }

      console.log('[serveTicket] Ticket filename:', ticketFilename);

      const ticketPath = path.join(__dirname, '../../tickets', ticketFilename);

      // Check if file exists
      if (!fs.existsSync(ticketPath)) {
        console.warn(`Ticket file not found: ${ticketPath}`);
        return res.status(404).json({
          success: false,
          error: {
            code: 'FILE_001',
            message: 'Ticket file not found',
          },
        });
      }

      console.log('[serveTicket] Serving file:', ticketPath);

      // Serve the PDF file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${bookingReference}-ticket.pdf"`);

      const fileStream = fs.createReadStream(ticketPath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('Error streaming ticket file:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: 'SYS_001',
              message: 'Error serving ticket file',
            },
          });
        }
      });
    } catch (error) {
      console.error('Error serving ticket:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to serve ticket',
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

  // ==================== ADMIN METHODS ====================

  /**
   * Get booking details by ID (Admin only)
   * GET /admin/bookings/:id
   */
  async getBookingDetailsAdmin(req, res) {
    try {
      const { id } = req.params;

      const booking = await bookingService.getBookingByIdAdmin(id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        data: booking,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error getting booking details (admin):', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve booking details',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Update booking status (Admin only)
   * PUT /admin/bookings/:id/status
   * Body: { status: "confirmed" | "cancelled" | "completed" }
   */
  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['confirmed', 'cancelled', 'completed'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Invalid status. Must be one of: confirmed, cancelled, completed',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const updatedBooking = await bookingService.updateBookingStatusAdmin(id, status);

      if (!updatedBooking) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_002',
            message: 'Booking not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        data: updatedBooking,
        message: `Booking status updated to ${status}`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error updating booking status (admin):', err);

      if (err.message.includes('Cannot update status')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BOOK_006',
            message: err.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to update booking status',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Process refund for a booking (Admin only)
   * POST /admin/bookings/:id/refund
   * Body: { refundAmount: number, reason: string }
   */
  async processRefundAdmin(req, res) {
    try {
      const { id } = req.params;
      const { refundAmount, reason } = req.body;

      // Parse refundAmount to ensure it's a number
      const numericRefundAmount = parseFloat(refundAmount);

      if (!numericRefundAmount || numericRefundAmount <= 0) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Invalid refund amount - must be a positive number',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await bookingService.processRefundAdmin(id, numericRefundAmount, reason);

      return res.json({
        success: true,
        data: result,
        message: 'Refund processed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error processing refund (admin):', err);

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

      if (err.message.includes('already refunded')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BOOK_007',
            message: err.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to process refund',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Process bulk refund for all confirmed bookings of a trip (Admin only)
   * POST /admin/trips/:tripId/bulk-refund
   * Body: { reason: string }
   */
  async processBulkRefundForTrip(req, res) {
    try {
      const { tripId } = req.params;
      const { reason } = req.body;

      if (!tripId) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Trip ID is required',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await bookingService.processBulkRefundForTrip(tripId, reason);

      return res.json({
        success: true,
        data: result,
        message: 'Bulk refund processed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error processing bulk refund:', err);

      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TRIP_001',
            message: 'Trip not found or no bookings to refund',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to process bulk refund',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Update passenger boarding status (Admin only)
   * PATCH /admin/passengers/:ticketId/boarding-status
   */
  async updatePassengerBoardingStatus(req, res) {
    try {
      const { ticketId } = req.params;
      const { boarding_status } = req.body;
      const adminId = req.user?.user_id; // From auth middleware

      // Validate boarding status
      const validStatuses = ['not_boarded', 'boarded', 'no_show'];
      if (!validStatuses.includes(boarding_status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Invalid boarding status. Must be: not_boarded, boarded, or no_show',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Update boarding status
      const updatedPassenger = await bookingService.updatePassengerBoardingStatus(
        ticketId,
        boarding_status,
        adminId
      );

      if (!updatedPassenger) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PASSENGER_001',
            message: 'Passenger not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: updatedPassenger,
        message: `Passenger boarding status updated to ${boarding_status}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️ Update passenger boarding status error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to update passenger boarding status',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new BookingController();
