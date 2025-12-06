const bookingService = require('./bookingService');
const { createBookingSchema, bookingLookupSchema } = require('./validators');

class BookingController {
  async createBooking(req, res) {
    try {
      console.log('📥 Incoming booking request:', JSON.stringify(req.body, null, 2));
      
      const { error, value } = createBookingSchema.validate(req.body);
      if (error) {
        console.error('❌ Validation error:', error.details[0].message);
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
          timestamp: new Date().toISOString()
        });
      }

      const { isGuestCheckout } = value;
      const userId = req.user ? req.user.userId : null;

      // Validate authentication for non-guest bookings
      if (!isGuestCheckout && !userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_001', message: 'Authentication required for registered user booking' },
          timestamp: new Date().toISOString()
        });
      }

      // For guest checkout, ensure contact info is provided
      if (isGuestCheckout && !value.contactEmail && !value.contactPhone) {
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_002', message: 'Either contactEmail or contactPhone is required for guest checkout' },
          timestamp: new Date().toISOString()
        });
      }

      const booking = await bookingService.createBooking(value, userId);

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created successfully. Please complete payment within 10 minutes.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('⚠️ Create booking error:', error);

      if (error.message.includes('Seats already booked')) {
        return res.status(409).json({
          success: false,
          error: { code: 'BOOKING_001', message: error.message },
          timestamp: new Date().toISOString()
        });
      }

      if (error.message.includes('Seats currently locked')) {
        return res.status(409).json({
          success: false,
          error: { code: 'BOOKING_002', message: error.message },
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getBooking(req, res) {
    try {
      const { bookingReference } = req.params;
      const booking = await bookingService.getBookingByReference(bookingReference);

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { code: 'BOOKING_003', message: 'Booking not found' },
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: booking,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('⚠️ Get booking error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString()
      });
    }
  }

  async lookupBooking(req, res) {
    try {
      const { error, value } = bookingLookupSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
          timestamp: new Date().toISOString()
        });
      }

      const { bookingReference, contactEmail, contactPhone } = value;
      const booking = await bookingService.lookupGuestBooking(
        bookingReference,
        contactEmail,
        contactPhone
      );

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { code: 'BOOKING_003', message: 'Booking not found' },
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: booking,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('⚠️ Lookup booking error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getUserBookings(req, res) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const bookings = await bookingService.getUserBookings(userId, page, limit);

      res.json({
        success: true,
        data: bookings,
        meta: { page, limit, count: bookings.length },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('⚠️ Get user bookings error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new BookingController();
