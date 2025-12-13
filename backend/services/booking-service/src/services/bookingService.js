const axios = require('axios');
const bookingRepository = require('../repositories/bookingRepository');
const passengerRepository = require('../repositories/passengerRepository');
const redisClient = require('../redis');
const {
  generateBookingReference,
  normalizeBookingReference,
  calculateServiceFee,
  calculateLockExpiration,
  formatPrice,
} = require('../utils/helpers');

class BookingService {
  /**
   * Create a new booking with seat locking
   * @param {object} bookingData - Booking data
   * @param {string|null} userId - User ID (null for guest)
   * @returns {Promise<object>} Created booking with passengers
   */
  async createBooking(bookingData, userId = null) {
    const { tripId, seats, passengers, contactEmail, contactPhone } = bookingData;

    // 1. Validate trip exists and get pricing
    const trip = await this.getTripById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    // 2. Check seat availability
    const bookedSeats = await bookingRepository.checkSeatsAvailability(tripId, seats);
    if (bookedSeats.length > 0) {
      throw new Error(`Seats already booked: ${bookedSeats.join(', ')}`);
    }

    // 3. Calculate pricing - Handle both camelCase and snake_case from Trip Service
    const seatPrice = trip.pricing.basePrice || trip.pricing.base_price;

    if (!seatPrice || seatPrice <= 0) {
      throw new Error('Invalid trip pricing. Cannot create booking.');
    }

    const subtotal = seatPrice * seats.length;
    const serviceFee = calculateServiceFee(subtotal);
    const totalPrice = subtotal + serviceFee;

    // 4. Generate unique booking reference with retry logic
    let bookingReference;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      bookingReference = generateBookingReference();

      // Check if reference already exists
      const existingBooking = await bookingRepository.findByReference(bookingReference);

      if (!existingBooking) {
        // Reference is unique, break the loop
        break;
      }

      attempts++;
      console.warn(
        `[BookingService] Duplicate booking reference generated: ${bookingReference}, attempt ${attempts}/${maxAttempts}`
      );

      // Add small delay to avoid collision in high concurrency
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    if (attempts >= maxAttempts) {
      console.error(
        '[BookingService] Failed to generate unique booking reference after max attempts'
      );
      throw new Error(
        'BOOKING_REFERENCE_GENERATION_FAILED: Unable to generate unique reference. Please try again.'
      );
    }

    console.log(
      `[BookingService] Generated unique booking reference: ${bookingReference} (attempts: ${attempts + 1})`
    );

    // 5. Create booking record
    const booking = await bookingRepository.create({
      bookingReference,
      tripId,
      userId,
      contactEmail,
      contactPhone,
      status: 'pending',
      lockedUntil: calculateLockExpiration(),
      subtotal: formatPrice(subtotal),
      serviceFee: formatPrice(serviceFee),
      totalPrice: formatPrice(totalPrice),
      currency: 'VND',
    });

    // 6. Create passenger records with validated price
    const passengerRecords = passengers.map((p, index) => {
      if (!p.seatCode) {
        throw new Error(`Passenger ${index + 1}: seatCode is required`);
      }
      if (!p.fullName || p.fullName.trim().length === 0) {
        throw new Error(`Passenger ${index + 1}: fullName is required`);
      }

      return {
        ...p,
        price: seatPrice, // Ensure price is always set from trip pricing
      };
    });

    const createdPassengers = await passengerRepository.createBatch(
      booking.booking_id,
      passengerRecords
    );

    // 7. Schedule expiration check in Redis
    await this.scheduleBookingExpiration(booking.booking_id, booking.locked_until);

    // 8. Return complete booking
    return {
      ...booking,
      passengers: createdPassengers,
      trip_details: {
        route: {
          origin: trip.route.origin,
          destination: trip.route.destination,
        },
        operator: {
          name: trip.operator.name,
        },
        schedule: {
          departure_time: trip.schedule.departure_time,
          arrival_time: trip.schedule.arrival_time,
        },
      },
    };
  }

  /**
   * Get booking by ID with full details
   * @param {string} bookingId - Booking UUID
   * @param {string|null} userId - User ID for authorization
   * @returns {Promise<object>} Booking with passengers and trip details
   */
  async getBookingById(bookingId, userId = null) {
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization
    if (userId && booking.userId && booking.userId !== userId) {
      throw new Error('Unauthorized to view this booking');
    }

    // Get passengers
    const passengers = await passengerRepository.findByBookingId(bookingId);

    // Get trip details
    const trip = await this.getTripById(booking.tripId);

    return {
      ...booking,
      passengers,
      trip_details: trip
        ? {
            route: {
              origin: trip.route.origin,
              destination: trip.route.destination,
            },
            operator: {
              name: trip.operator.name,
            },
            schedule: {
              departure_time: trip.schedule.departure_time,
              arrival_time: trip.schedule.arrival_time,
            },
          }
        : null,
    };
  }

  /**
   * Get booking by reference (for guest checkout)
   * @param {string} bookingReference - Booking reference
   * @param {string} contactEmail - Contact email for verification
   * @returns {Promise<object>} Booking details
   */
  async getBookingByReference(bookingReference, contactEmail) {
    const booking = await bookingRepository.findByReference(bookingReference);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Verify contact email for guest bookings
    if (!booking.userId && booking.contact_email !== contactEmail) {
      throw new Error('Invalid booking reference or email');
    }

    // Get passengers
    const passengers = await passengerRepository.findByBookingId(booking.booking_id);

    // Get trip details
    const trip = await this.getTripById(booking.trip_id);

    return {
      ...booking,
      passengers,
      trip_details: trip
        ? {
            route: {
              origin: trip.route.origin,
              destination: trip.route.destination,
            },
            operator: {
              name: trip.operator.name,
            },
            schedule: {
              departure_time: trip.schedule.departure_time,
              arrival_time: trip.schedule.arrival_time,
            },
          }
        : null,
    };
  }

  /**
   * Guest booking lookup (accepts phone OR email)
   * @param {string} bookingReference - Booking reference (6-char code)
   * @param {string|null} phone - Contact phone for verification
   * @param {string|null} email - Contact email for verification
   * @returns {Promise<object>} Booking details
   */
  async guestLookupBooking(bookingReference, phone = null, email = null) {
    // Normalize booking reference (case-insensitive)
    const normalizedRef = normalizeBookingReference(bookingReference);

    // Find booking by reference
    const booking = await bookingRepository.findByReference(normalizedRef);

    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    // Verify contact information (phone OR email must match)
    let isVerified = false;

    if (phone && booking.contact_phone) {
      // Normalize phone numbers for comparison (remove spaces, handle +84/0 prefix)
      const normalizePhone = (p) => p.replace(/\s+/g, '').replace(/^0/, '+84');
      isVerified = normalizePhone(booking.contact_phone) === normalizePhone(phone);
    }

    if (!isVerified && email && booking.contact_email) {
      // Case-insensitive email comparison
      isVerified = booking.contact_email.toLowerCase() === email.toLowerCase();
    }

    if (!isVerified) {
      throw new Error('CONTACT_MISMATCH');
    }

    // Get passengers
    const passengers = await passengerRepository.findByBookingId(booking.booking_id);

    // Get trip details
    const trip = await this.getTripById(booking.trip_id);

    return {
      ...booking,
      passengers,
      trip_details: trip
        ? {
            route: {
              origin: trip.route.origin,
              destination: trip.route.destination,
            },
            operator: {
              name: trip.operator.name,
            },
            schedule: {
              departure_time: trip.schedule.departure_time,
              arrival_time: trip.schedule.arrival_time,
            },
          }
        : null,
    };
  }

  /**
   * Get user bookings with pagination and filters
   * @param {string} userId - User UUID
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated bookings
   */
  async getUserBookings(userId, filters) {
    const result = await bookingRepository.findByUserId(userId, filters);

    // Enrich each booking with passengers count
    const enrichedBookings = await Promise.all(
      result.bookings.map(async (booking) => {
        const passengers = await passengerRepository.findByBookingId(booking.booking_id);
        return {
          ...booking,
          passengersCount: passengers.length,
          seatCodes: passengers.map((p) => p.seat_code),
        };
      })
    );

    return {
      bookings: enrichedBookings,
      pagination: result.pagination,
    };
  }

  /**
   * Confirm payment for a booking
   * @param {string} bookingId - Booking UUID
   * @param {object} paymentData - Payment data
   * @returns {Promise<object>} Updated booking
   */
  async confirmPayment(bookingId, paymentData) {
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Cannot pay for cancelled booking');
    }

    if (booking.payment.status === 'paid') {
      throw new Error('Booking already paid');
    }

    // Update payment status
    const updatedBooking = await bookingRepository.updatePayment(bookingId, {
      paymentStatus: 'paid',
      paymentMethod: paymentData.paymentMethod,
      paidAt: new Date(),
    });

    // Clear expiration from Redis
    await redisClient.del(`booking:expiration:${bookingId}`);

    // Send comprehensive booking confirmation email with user preferences check
    await this.sendBookingConfirmationEmail(updatedBooking, paymentData);

    return updatedBooking;
  }

  /**
   * Cancel a booking
   * @param {string} bookingId - Booking UUID
   * @param {string} userId - User ID
   * @param {object} cancellationData - Cancellation data
   * @returns {Promise<object>} Updated booking with refund info
   */
  async cancelBooking(bookingId, userId, cancellationData) {
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization
    if (booking.userId && booking.userId !== userId) {
      throw new Error('Unauthorized to cancel this booking');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Booking already cancelled');
    }

    if (booking.status === 'completed') {
      throw new Error('Cannot cancel completed booking');
    }

    // Calculate refund based on cancellation policy
    const refundAmount = await this.calculateRefund(booking);

    // Cancel booking
    const cancelledBooking = await bookingRepository.cancel(bookingId, {
      reason: cancellationData.reason,
      refundAmount: cancellationData.requestRefund ? refundAmount : 0,
    });

    // Clear expiration from Redis
    await redisClient.del(`booking:expiration:${bookingId}`);

    // Release seat locks since booking is cancelled
    try {
      const passengers = await passengerRepository.findByBookingId(bookingId);
      const seatCodes = passengers.map((p) => p.seat_code);

      if (seatCodes.length > 0) {
        console.log(`🔓 Attempting to release locks for seats: ${seatCodes.join(', ')}`);
        await this.releaseLocksForCancelledBooking(booking.trip_id, seatCodes, booking.user_id);
        console.log(`✅ Released locks for cancelled booking seats: ${seatCodes.join(', ')}`);
      } else {
        console.log('⚠️ No seat codes found for cancelled booking');
      }
    } catch (error) {
      console.error('Error releasing locks for cancelled booking:', error);
      // Don't fail cancellation if lock release fails
    }

    // Send cancellation notification
    await this.sendCancellationNotification(cancelledBooking);

    return {
      ...cancelledBooking,
      refund: {
        amount: refundAmount,
        percentage: this.calculateRefundPercentage(booking),
        processingTime: '3-5 business days',
      },
    };
  }

  /**
   * Calculate refund amount based on cancellation policy
   * @param {object} booking - Booking object
   * @returns {Promise<number>} Refund amount
   */
  async calculateRefund(booking) {
    if (booking.payment.status !== 'paid') {
      return 0;
    }

    // Get trip details to check departure time
    const trip = await this.getTripById(booking.trip_id);
    if (!trip) {
      return 0;
    }

    const now = new Date();
    const departureTime = new Date(trip.schedule.departureTime);
    const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

    // Refund policy:
    // - More than 24 hours: 100% refund
    // - 12-24 hours: 80% refund
    // - 6-12 hours: 50% refund
    // - Less than 6 hours: 20% refund
    let refundPercentage = 0;

    if (hoursUntilDeparture >= 24) {
      refundPercentage = 100;
    } else if (hoursUntilDeparture >= 12) {
      refundPercentage = 80;
    } else if (hoursUntilDeparture >= 6) {
      refundPercentage = 50;
    } else if (hoursUntilDeparture >= 0) {
      refundPercentage = 20;
    }

    return formatPrice(booking.pricing.total * (refundPercentage / 100));
  }

  /**
   * Calculate refund percentage
   * @param {object} booking - Booking object
   * @returns {number} Refund percentage
   */
  calculateRefundPercentage() {
    // Similar logic as calculateRefund but return percentage
    return 80; // Default for now
  }

  /**
   * Process expired bookings
   * @returns {Promise<number>} Number of bookings cancelled
   */
  async processExpiredBookings() {
    const expiredBookings = await bookingRepository.findExpiredBookings();

    let cancelledCount = 0;

    for (const booking of expiredBookings) {
      try {
        // Get passengers before cancelling to know which seats to release
        const passengers = await passengerRepository.findByBookingId(booking.booking_id);
        const seatCodes = passengers.map((p) => p.seat_code);

        await bookingRepository.cancel(booking.booking_id, {
          reason: 'Booking expired - payment not received',
          refundAmount: 0,
        });

        await redisClient.del(`booking:expiration:${booking.booking_id}`);

        // Release seat locks for expired booking
        if (seatCodes.length > 0) {
          try {
            console.log(
              `🔓 Attempting to release locks for expired booking seats: ${seatCodes.join(', ')}`
            );
            await this.releaseLocksForCancelledBooking(booking.trip_id, seatCodes, booking.user_id);
            console.log(`✅ Released locks for expired booking seats: ${seatCodes.join(', ')}`);
          } catch (error) {
            console.error('❌ Error releasing locks for expired booking:', error);
          }
        } else {
          console.log('⚠️ No seat codes found for expired booking');
        }

        cancelledCount++;
      } catch (error) {
        console.error(`Failed to cancel expired booking ${booking.booking_id}:`, error);
      }
    }

    return cancelledCount;
  }

  /**
   * Schedule booking expiration in Redis
   * @param {string} bookingId - Booking UUID
   * @param {Date} expirationTime - Expiration timestamp
   */
  async scheduleBookingExpiration(bookingId, expirationTime) {
    const ttl = Math.floor((new Date(expirationTime) - new Date()) / 1000);
    if (ttl > 0) {
      await redisClient.setEx(
        `booking:expiration:${bookingId}`,
        ttl,
        JSON.stringify({ bookingId, expirationTime })
      );
    }
  }

  /**
   * Get trip details from trip service
   * @param {string} tripId - Trip UUID
   * @returns {Promise<object|null>} Trip details
   */
  async getTripById(tripId) {
    try {
      const tripServiceUrl = process.env.TRIP_SERVICE_URL || 'http://trip-service:3002';
      const response = await axios.get(`${tripServiceUrl}/${tripId}`);

      if (response.data.success && response.data.data) {
        const trip = response.data.data;

        // Normalize pricing format (handle both camelCase and snake_case)
        if (trip.pricing) {
          if (trip.pricing.base_price && !trip.pricing.basePrice) {
            trip.pricing.basePrice = trip.pricing.base_price;
          }
        }

        return trip;
      }

      return null;
    } catch (error) {
      console.error('Error fetching trip:', error.message);
      if (error.response) {
        console.error('Trip Service response:', error.response.status, error.response.data);
      }
      return null;
    }
  }

  /**
   * Send comprehensive booking confirmation email with all details
   * @param {object} booking - Booking object with payment info
   * @param {object} paymentData - Payment data
   */
  async sendBookingConfirmationEmail(booking, paymentData) {
    try {
      // 1. Get full booking details including trip info
      const tripDetails = await this.getTripById(booking.trip_id);
      if (!tripDetails) {
        console.warn('Trip details not found for booking confirmation email');
        return;
      }

      // 2. Get passengers
      const passengers = await passengerRepository.findByBookingId(booking.booking_id);

      // 3. Get user preferences (if logged-in user, otherwise use defaults)
      let shouldSendEmail = true;
      if (booking.user_id) {
        try {
          const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
          const userResponse = await axios.get(`${authServiceUrl}/users/${booking.user_id}`);
          const userPreferences = userResponse.data?.data?.preferences;

          if (userPreferences && userPreferences.notifications) {
            shouldSendEmail = userPreferences.notifications.bookingConfirmations?.email !== false;
          }
        } catch (error) {
          console.warn(
            'Could not fetch user preferences, sending email by default:',
            error.message
          );
        }
      }

      if (!shouldSendEmail) {
        console.log(
          `📧 Email skipped - user has disabled booking confirmation emails for booking ${booking.booking_reference}`
        );
        return;
      }

      // 4. Prepare comprehensive booking data
      const bookingConfirmationData = {
        bookingReference: booking.booking_reference,
        customerName: passengers[0]?.passenger_name || 'Valued Customer',
        customerEmail: booking.contact_email,
        customerPhone: booking.contact_phone,
        tripDetails: {
          origin: tripDetails.route?.origin || 'Unknown',
          destination: tripDetails.route?.destination || 'Unknown',
          departureTime: tripDetails.schedule?.departureTime,
          arrivalTime: tripDetails.schedule?.arrivalTime,
          operatorName: tripDetails.operator?.name || 'Bus Operator',
          busModel: tripDetails.bus?.model || 'Bus',
          pickupPoint: tripDetails.pickupPoints?.[0]?.name || 'TBD',
          dropoffPoint: tripDetails.dropoffPoints?.[0]?.name || 'TBD',
        },
        passengers: passengers.map((p) => ({
          fullName: p.passenger_name,
          documentId: p.document_id,
          seatCode: p.seat_code,
          seatPrice: tripDetails.pricing?.basePrice || 0,
        })),
        pricing: {
          basePrice: tripDetails.pricing?.basePrice || 0,
          subtotal: booking.subtotal,
          serviceFee: booking.service_fee,
          total: booking.total_price,
          paymentMethod: paymentData?.paymentMethod || 'Unknown',
        },
        eTicketUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${booking.booking_reference}/ticket`,
        qrCodeUrl: `${process.env.API_URL || 'http://localhost:3000'}/api/bookings/${booking.booking_reference}/qr`,
        bookingDetailsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${booking.booking_reference}`,
        cancellationPolicy:
          tripDetails.policies?.cancellationPolicy || 'Please check with operator',
        operatorContact: {
          phone: tripDetails.operator?.phone || '+84-XXX-XXXX',
          email: tripDetails.operator?.email || 'operator@example.com',
          website: tripDetails.operator?.website || 'www.operator.com',
        },
      };

      // 5. Send email through notification service
      const notificationServiceUrl =
        process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
      const response = await axios.post(`${notificationServiceUrl}/send-booking-confirmation`, {
        email: booking.contact_email,
        bookingData: bookingConfirmationData,
      });

      if (response.data?.success) {
        console.log(
          `✅ Booking confirmation email sent to ${booking.contact_email} for ${booking.booking_reference}`
        );
      }

      // 6. Send SMS confirmation if phone number is provided
      if (booking.contact_phone) {
        try {
          const smsBookingData = {
            bookingReference: booking.booking_reference,
            tripName: `${tripDetails.route?.origin || 'Origin'} to ${tripDetails.route?.destination || 'Destination'}`,
            departureTime: tripDetails.schedule?.departureTime || 'TBD',
            fromLocation: tripDetails.route?.origin || 'Origin',
            toLocation: tripDetails.route?.destination || 'Destination',
            seats: passengers.map((p) => p.seat_code),
            totalPrice: booking.total_price,
            currency: booking.currency || 'VND',
          };

          const smsResponse = await axios.post(
            `${notificationServiceUrl}/send-sms-booking-confirmation`,
            {
              phoneNumber: booking.contact_phone,
              bookingData: smsBookingData,
            }
          );

          if (smsResponse.data?.success) {
            console.log(
              `📱 Booking confirmation SMS sent to ${booking.contact_phone} for ${booking.booking_reference}`
            );
          }
        } catch (smsError) {
          console.error(
            `❌ Error sending booking confirmation SMS for ${booking.booking_reference}:`,
            smsError.message
          );
          // Don't fail booking confirmation if SMS sending fails
        }
      }
    } catch (error) {
      console.error(
        `❌ Error sending booking confirmation email for ${booking.booking_reference}:`,
        error.message
      );
      // Don't fail booking confirmation if email sending fails
    }
  }

  /**
   * Send booking confirmation notification
   * @param {object} booking - Booking object
   */
  async sendBookingConfirmation(booking) {
    try {
      const notificationServiceUrl =
        process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
      await axios.post(`${notificationServiceUrl}/send-email`, {
        to: booking.contact_email,
        template: 'booking-confirmation',
        data: {
          bookingReference: booking.booking_reference,
          bookingId: booking.booking_id,
        },
      });
    } catch (error) {
      console.error('Error sending confirmation notification:', error.message);
    }
  }

  /**
   * Send cancellation notification
   * @param {object} booking - Booking object
   */
  async sendCancellationNotification(booking) {
    try {
      const notificationServiceUrl =
        process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
      await axios.post(`${notificationServiceUrl}/send-email`, {
        to: booking.contact_email,
        template: 'booking-cancellation',
        data: {
          bookingReference: booking.booking_reference,
          refundAmount: booking.cancellation?.refund_amount || 0,
        },
      });
    } catch (error) {
      console.error('Error sending cancellation notification:', error.message);
    }
  }

  /**
   * Share ticket via email
   * @param {string} bookingReference - Booking reference
   * @param {string} email - Recipient email
   * @param {string} phone - Optional verification phone
   * @returns {Promise<object>} Result
   */
  async shareTicket(bookingReference, email, phone = null) {
    try {
      console.log(`📧 Sharing ticket for booking: ${bookingReference} to ${email}`);

      // 1. Find booking by reference (normalize to uppercase)
      const normalizedRef = normalizeBookingReference(bookingReference);
      const booking = await bookingRepository.findByReference(normalizedRef);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // 2. Check booking status
      if (booking.status !== 'confirmed') {
        throw new Error('Booking is not confirmed. Only confirmed bookings can be shared.');
      }

      // 3. Optional phone verification for security
      if (phone && booking.contact_phone) {
        const normalizedInputPhone = phone.replace(/\s+/g, '');
        const normalizedBookingPhone = booking.contact_phone.replace(/\s+/g, '');

        if (normalizedInputPhone !== normalizedBookingPhone) {
          throw new Error('Phone number does not match booking records');
        }
      }

      // 4. Check if ticket exists (repository maps DB columns to snake_case)
      if (!booking.e_ticket || !booking.e_ticket.ticket_url) {
        throw new Error('E-ticket not generated yet. Please try again later.');
      }

      // 5. Send ticket email via notification service
      const notificationServiceUrl =
        process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

      const emailPayload = {
        type: 'booking-ticket',
        to: email,
        bookingData: {
          reference: booking.booking_reference,
          tripId: booking.trip_id,
          status: booking.status,
          totalPrice: booking.pricing.total,
          currency: booking.pricing.currency || 'VND',
          passengers: booking.passengers || [],
          contactEmail: booking.contact_email,
          contactPhone: booking.contact_phone,
        },
        ticketUrl: booking.e_ticket.ticket_url,
        qrCode: booking.e_ticket.qr_code_url,
      };

      const response = await axios.post(`${notificationServiceUrl}/send-email`, emailPayload, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data.success) {
        console.log(`✅ Ticket shared successfully to: ${email}`);
        return {
          sent: true,
          recipient: email,
          bookingReference: booking.booking_reference,
        };
      } else {
        throw new Error('Email service returned unsuccessful response');
      }
    } catch (error) {
      console.error(`❌ Error sharing ticket:`, error.message);
      throw error;
    }
  }

  /**
   * Release seat locks for cancelled booking
   * @param {string} tripId - Trip ID
   * @param {string[]} seatCodes - Array of seat codes to release
   * @param {string|null} userId - User ID (null for guests)
   */
  async releaseLocksForCancelledBooking(tripId, seatCodes, userId) {
    try {
      const tripServiceUrl = process.env.TRIP_SERVICE_URL || 'http://localhost:3002';

      // For authenticated users, try to release with userId as sessionId
      if (userId) {
        try {
          const response = await axios.post(
            `${tripServiceUrl}/${tripId}/seats/release`,
            {
              seatCodes,
              sessionId: userId, // For auth users, sessionId = userId
              isGuest: false,
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 5000,
            }
          );

          if (response.data.success) {
            console.log(`✅ Released locks for authenticated user seats: ${seatCodes.join(', ')}`);
            return response.data.data;
          }
        } catch (error) {
          console.error('❌ Failed to release locks for authenticated user:', error.message);
        }
      }

      // For guests or as fallback, use service call without auth (releases locks without ownership validation)
      try {
        const response = await axios.post(
          `${tripServiceUrl}/${tripId}/seats/release`,
          {
            seatCodes,
            isGuest: true, // This triggers the service call path
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
          }
        );

        if (response.data.success) {
          console.log(
            `✅ Released locks for guest seats via service call: ${seatCodes.join(', ')}`
          );
          return response.data.data;
        }
      } catch (error) {
        console.error('❌ Failed to release locks via service call:', error.message);
      }
    } catch (error) {
      console.error('❌ Error in releaseLocksForCancelledBooking:', error.message);
    }
  }
}

module.exports = new BookingService();
