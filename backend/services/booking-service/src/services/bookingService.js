const axios = require('axios');
const fs = require('fs');
const path = require('path');
const bookingRepository = require('../repositories/bookingRepository');
const passengerRepository = require('../repositories/passengerRepository');
const redisClient = require('../redis');
const ticketService = require('./ticketService');
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
      subtotal: subtotal,
      serviceFee: serviceFee,
      totalPrice: totalPrice,
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

    // Check authorization (DB returns snake_case fields)
    if (userId && booking.user_id && booking.user_id !== userId) {
      throw new Error('Unauthorized to view this booking');
    }

    // Get passengers
    const passengers = await passengerRepository.findByBookingId(bookingId);

    // Get trip details (booking record has `trip_id` column)
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

    // Verify contact email for guest bookings (DB uses snake_case)
    if (!booking.user_id && booking.contact_email !== contactEmail) {
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
  async confirmPayment(bookingId, paymentData, userId = null) {
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

    // If request includes authenticated user and booking is a guest booking,
    // assign the user_id to the booking so API responses include it.
    if (!booking.user_id && userId) {
      try {
        const assigned = await bookingRepository.updateUserId(bookingId, userId);
        if (assigned) {
          Object.assign(booking, assigned);
        }
      } catch (err) {
        console.warn('[BookingService] Failed to assign user_id to booking:', err.message || err);
      }
    }

    // Update payment status
    const updatedBooking = await bookingRepository.updatePayment(bookingId, {
      paymentStatus: 'paid',
      paymentMethod: paymentData.paymentMethod,
      paidAt: new Date(),
    });

    // Read the updated booking to ensure transaction visibility
    const verifiedBooking = await bookingRepository.findById(bookingId);
    console.log(
      `✅ Booking ${bookingId} status verified: ${verifiedBooking.status}, payment: ${verifiedBooking.payment.status}`
    );

    // Clear expiration from Redis
    await redisClient.del(`booking:expiration:${bookingId}`);

    // Clear Redis seat locks for this booking
    try {
      const passengers = await passengerRepository.findByBookingId(bookingId);
      console.log(`🔍 Found ${passengers.length} passengers for booking ${bookingId}`);
      const seatCodes = passengers.map((p) => p.seat_code);
      console.log(`🎫 Seat codes to unlock: ${seatCodes.join(', ')}`);

      if (seatCodes.length > 0) {
        // Get trip ID from booking
        const tripId = updatedBooking.trip_id;
        const lockKeyPrefix = `seat:lock:${tripId}`;

        // Delete all seat locks for this booking
        const lockKeys = seatCodes.map((seatCode) => `${lockKeyPrefix}:${seatCode}`);
        console.log(`🔑 Redis keys to delete: ${lockKeys.join(', ')}`);
        if (lockKeys.length > 0) {
          const deletedCount = await redisClient.del(...lockKeys);
          console.log(`✅ Cleared ${deletedCount} Redis seat locks for booking ${bookingId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error clearing Redis seat locks:', error);
      // Don't throw - booking confirmation should succeed even if Redis cleanup fails
    }

    // Trigger ticket generation (PDF + QR). Prefer to wait a short time so
    // the confirm-payment response can include `e_ticket` fields if generation
    // completes quickly. If it doesn't finish within the timeout, allow it to
    // continue in the background and return the response immediately.
    try {
      const ticketTimeoutMs = parseInt(process.env.TICKET_GENERATION_TIMEOUT_MS, 10) || 5000;

      const ticketPromise = ticketService.processTicketGeneration(bookingId);

      // Wait for either ticket generation or timeout
      const ticketResult = await Promise.race([
        ticketPromise,
        new Promise((resolve) => setTimeout(() => resolve(null), ticketTimeoutMs)),
      ]);

      if (ticketResult) {
        console.log(`🎫 Ticket generation completed within ${ticketTimeoutMs}ms for ${bookingId}`);
        // Refresh booking to include ticket URLs written by the ticket service
        try {
          const refreshed = await bookingRepository.findById(bookingId);
          if (refreshed) {
            // Use refreshed booking as the response payload
            // Note: bookingRepository.findById returns mapped booking object
            Object.assign(updatedBooking, refreshed);
          }
        } catch (refreshErr) {
          console.warn('⚠️ Failed to refresh booking after ticket generation:', refreshErr.message);
        }
      } else {
        // Generation is still running in background — attach logging for completion
        ticketPromise
          .then(() =>
            console.log(`🎫 Background ticket generation finished for booking ${bookingId}`)
          )
          .catch((err) =>
            console.error(
              `❌ Background ticket generation failed for booking ${bookingId}:`,
              err.message || err
            )
          );
        console.log(
          `Ticket generation did not finish within ${ticketTimeoutMs}ms; returning response and continuing generation in background.`
        );
      }
    } catch (err) {
      console.error('❌ Failed to start/wait for ticket generation:', err.message || err);
    }

    // Send comprehensive booking confirmation email (non-blocking to avoid delaying API)
    this.sendBookingConfirmationEmail(updatedBooking, paymentData).catch((err) => {
      console.error('❌ Error sending booking confirmation email:', err.message || err);
    });

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

    // Check authorization (DB uses snake_case)
    if (booking.user_id && booking.user_id !== userId) {
      throw new Error('Unauthorized to cancel this booking');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Booking already cancelled');
    }

    if (booking.status === 'completed') {
      throw new Error('Cannot cancel completed booking');
    }

    // Prevent user-initiated cancellation for already paid & confirmed bookings.
    if (booking.status === 'confirmed' && booking.payment && booking.payment.status === 'paid') {
      throw new Error(
        'Cannot cancel a confirmed booking with completed payment. Please contact support for refund requests.'
      );
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

      console.log(
        `[BookingService] Sending booking confirmation email for ${booking.booking_reference}`
      );

      // 3. Prepare comprehensive booking data
      const bookingConfirmationData = {
        bookingReference: booking.booking_reference,
        customerName: passengers[0]?.full_name || 'Valued Customer',
        customerEmail: booking.contact_email,
        customerPhone: booking.contact_phone,
        tripDetails: {
          origin: tripDetails.route?.origin || 'Unknown',
          destination: tripDetails.route?.destination || 'Unknown',
          departureTime: tripDetails.schedule?.departure_time,
          arrivalTime: tripDetails.schedule?.arrival_time,
          operatorName: tripDetails.operator?.name || 'Bus Operator',
          busModel: tripDetails.bus?.model || 'Bus',
          pickupPoint: tripDetails.pickup_points?.[0]?.name || 'TBD',
          dropoffPoint: tripDetails.dropoff_points?.[0]?.name || 'TBD',
        },
        passengers: passengers.map((p) => ({
          fullName: p.full_name,
          documentId: p.document_id,
          seatCode: p.seat_code,
          seatPrice: parseFloat(tripDetails.pricing?.base_price) || 0,
        })),
        pricing: {
          basePrice: parseFloat(tripDetails.pricing?.base_price) || 0,
          subtotal: parseFloat(booking.pricing?.subtotal) || 0,
          serviceFee: parseFloat(booking.pricing?.service_fee) || 0,
          total: parseFloat(booking.pricing?.total) || 0,
          paymentMethod: paymentData?.paymentMethod || 'Unknown',
        },
        // Prefer direct links stored on the booking (set by ticket generation).
        // When constructing fallbacks, prefer `API_URL` so other services can reach the URL inside Docker networks.
        eTicketUrl:
          (booking.e_ticket && booking.e_ticket.ticket_url) ||
          booking.ticket_url ||
          `${process.env.API_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${booking.booking_reference}/ticket`,
        qrCodeUrl:
          (booking.e_ticket && booking.e_ticket.qr_code_url) ||
          booking.qr_code_url ||
          `${process.env.API_URL || 'http://localhost:3000'}/api/bookings/${booking.booking_reference}/qr`,
        bookingDetailsUrl: null,
        cancellationPolicy: (() => {
          const p = tripDetails.policies || {};
          // Prefer explicit cancellation keys
          if (p.cancellationPolicy) return p.cancellationPolicy;
          if (p.cancellation_policy) return p.cancellation_policy;

          // Construct a clear, professional cancellation policy from available fields.
          // Try to convert concise values into full sentences for customer-facing copy.
          const parts = [];

          if (p.refund) {
            const r = String(p.refund).toLowerCase();
            if (r.includes('24')) {
              parts.push('Full refund available if cancelled at least 24 hours before departure.');
            } else if (r.includes('12')) {
              parts.push('Full refund available if cancelled at least 12 hours before departure.');
            } else if (r.includes('6')) {
              parts.push(
                'Partial refund available if cancelled at least 6 hours before departure.'
              );
            } else if (r.includes('no') || r.includes('none')) {
              parts.push('No refund available for cancellations.');
            } else {
              parts.push(`Refund terms: ${p.refund}`);
            }
          }

          if (p.changes) {
            const c = String(p.changes).toLowerCase();
            if (c.includes('allow')) {
              parts.push(
                "Changes to the booking are permitted and subject to the operator's policies."
              );
            } else if (c.includes('not')) {
              parts.push('Changes to the booking are not permitted.');
            } else {
              parts.push(`Change policy: ${p.changes}`);
            }
          }

          if (parts.length > 0) return parts.join(' ');

          // Default fallback when no policy details are present
          return 'Please contact the operator for cancellation details.';
        })(),
        operatorContact: {
          phone: tripDetails.operator?.phone || '+84-XXX-XXXX',
          email: tripDetails.operator?.email || 'operator@example.com',
          website: tripDetails.operator?.website || 'www.operator.com',
        },
      };

      // 4. Send email through notification service
      const notificationServiceUrl =
        process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
      // If an e-ticket file exists on disk (tickets directory), include base64 payload
      try {
        const ticketPublicUrl = bookingConfirmationData.eTicketUrl;
        const filenameMatch =
          ticketPublicUrl && String(ticketPublicUrl).match(/\/bookings\/tickets\/(.+)$/i);
        if (filenameMatch && filenameMatch[1]) {
          const filename = filenameMatch[1];
          const ticketsDir = path.join(__dirname, '../../tickets');
          const filePath = path.join(ticketsDir, filename);
          if (fs.existsSync(filePath)) {
            const buffer = await fs.promises.readFile(filePath);
            bookingConfirmationData.eTicketBase64 = buffer.toString('base64');
            bookingConfirmationData.eTicketFilename = filename;
            console.log(
              `📎 Attached local e-ticket file for booking ${booking.booking_reference}: ${filename}`
            );
          } else {
            console.log(
              `ℹ️ e-ticket file not found on disk for booking ${booking.booking_reference}: ${filePath}`
            );
          }
        }
      } catch (err) {
        console.warn('Could not attach local e-ticket file to booking data:', err.message || err);
      }

      const response = await axios.post(`${notificationServiceUrl}/send-booking-confirmation`, {
        email: booking.contact_email,
        bookingData: bookingConfirmationData,
      });

      if (response.data?.success) {
        console.log(
          `✅ Booking confirmation email sent to ${booking.contact_email} for ${booking.booking_reference}`
        );
      }

      // 5. Send SMS confirmation if phone number is provided and user has opted in
      let smsEnabled = false;

      try {
        if (booking && booking.user_id) {
          const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
          // Call auth service; supply userId as a query param for internal service lookup.
          const profileRes = await axios.get(`${authServiceUrl}/auth/me`, {
            params: { userId: booking.user_id },
            timeout: 3000,
          });

          if (profileRes && profileRes.data && profileRes.data.data) {
            const userProfile = profileRes.data.data;
            if (
              userProfile.preferences &&
              (userProfile.preferences.send_sms === true ||
                userProfile.nces?.receive_sms_notifications === true)
            ) {
              smsEnabled = true;
            } else if (userProfile.preferences && userProfile.preferences.send_sms === false) {
              smsEnabled = false;
            }
          }
        }
      } catch (err) {
        console.warn(
          `[BookingService] Could not fetch user profile for sms preference (userId=${booking && booking.user_id}): ${err.message}`
        );
      }

      // Send SMS if enabled and phone number available
      try {
        if (smsEnabled && booking.contact_phone) {
          const smsPayload = {
            to: booking.contact_phone,
            template: 'booking-confirmation-sms',
            data: {
              bookingReference: booking.booking_reference,
              departureTime: tripDetails.schedule?.departure_time,
              origin: tripDetails.route?.origin,
              destination: tripDetails.route?.destination,
            },
          };
          await axios.post(`${notificationServiceUrl}/send-sms`, smsPayload);
          console.log(`✅ SMS booking confirmation sent to ${booking.contact_phone}`);
        } else {
          console.log('ℹ️ SMS not sent: not enabled or phone number missing');
        }
      } catch (err) {
        console.warn(`⚠️ Failed to send SMS confirmation: ${err.message || err}`);
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
