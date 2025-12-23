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
const {
  calculateRefund: calculateRefundPolicy,
  validateCancellation,
  getAllPolicyTiers,
  formatRefundDetails,
} = require('../utils/cancellationPolicy');

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

    // Enrich each booking with passengers count, rating status, and trip details
    const enrichedBookings = await Promise.all(
      result.bookings.map(async (booking) => {
        const passengers = await passengerRepository.findByBookingId(booking.booking_id);

        // Check if booking has a rating
        let hasRating = false;
        try {
          const tripServiceUrl = process.env.TRIP_SERVICE_URL || 'http://localhost:3002';
          const ratingResponse = await axios.get(
            `${tripServiceUrl}/ratings/check/${booking.booking_id}`,
            {
              headers: {
                'x-user-id': userId,
              },
              timeout: 5000,
            }
          );
          hasRating = ratingResponse.data?.hasRating || false;
        } catch (error) {
          // If rating check fails, assume no rating (don't break booking loading)
          console.warn(`Failed to check rating for booking ${booking.booking_id}:`, error.message);
          hasRating = false;
        }

        // Fetch trip details
        let tripDetails = null;
        try {
          const trip = await this.getTripById(booking.trip_id);
          if (trip) {
            tripDetails = {
              route: {
                origin: trip.route?.origin || trip.origin,
                destination: trip.route?.destination || trip.destination,
              },
              operator: {
                name: trip.operator?.name || 'Unknown Operator',
              },
              schedule: {
                departure_time: trip.schedule?.departure_time || trip.schedule?.departureTime,
                arrival_time: trip.schedule?.arrival_time || trip.schedule?.arrivalTime,
              },
            };
          }
        } catch (error) {
          console.error(
            `Failed to fetch trip details for booking ${booking.booking_id}:`,
            error.message
          );
        }

        return {
          ...booking,
          passengersCount: passengers.length,
          seatCodes: passengers.map((p) => p.seat_code),
          hasRating,
          trip_details: tripDetails,
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
   * Get cancellation policy preview for a booking
   * Shows what refund the user would get if they cancel now
   * @param {string} bookingId - Booking UUID
   * @param {string|null} userId - User ID for authorization
   * @returns {Promise<object>} Cancellation policy and refund preview
   */
  async getCancellationPreview(bookingId, userId = null) {
    // Get booking
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization - only owner can view cancellation preview
    if (booking.user_id && booking.user_id !== userId && userId !== null) {
      throw new Error('Unauthorized to view this booking');
    }

    // Get trip details for departure time
    const trip = await this.getTripById(booking.trip_id);
    if (!trip) {
      throw new Error('Trip information not found');
    }

    const departureTime = new Date(trip.schedule.departureTime || trip.schedule.departure_time);

    // Validate if cancellation is allowed
    const validation = validateCancellation(booking, departureTime);

    if (!validation.valid) {
      return {
        canCancel: false,
        error: validation.error,
        booking: {
          id: booking.booking_id,
          reference: booking.booking_reference,
          status: booking.status,
        },
      };
    }

    // Calculate refund with current cancellation policy
    const refundCalculation = calculateRefundPolicy(booking, departureTime);

    // Get all policy tiers for reference
    const policyTiers = getAllPolicyTiers();

    return {
      canCancel: true,
      booking: {
        id: booking.booking_id,
        reference: booking.booking_reference,
        status: booking.status,
        totalPrice: parseFloat(booking.total_price),
        paymentStatus: booking.payment_status,
      },
      trip: {
        departureTime: departureTime.toISOString(),
        hoursUntilDeparture: refundCalculation.tier.hoursUntilDeparture,
      },
      refund: {
        tier: refundCalculation.tier.name,
        tierDescription: refundCalculation.tier.description,
        canRefund: refundCalculation.canRefund,
        refundAmount: refundCalculation.refundAmount,
        processingFee: refundCalculation.processingFee,
        totalRefund: refundCalculation.totalRefund,
        refundPercentage: refundCalculation.refundPercentage,
        processingTime: '3-5 business days',
        formattedDetails: formatRefundDetails(refundCalculation),
      },
      policyTiers, // Include all tiers for user reference
    };
  }

  /**
   * Cancel a booking with enhanced refund processing
   * @param {string} bookingId - Booking UUID
   * @param {string|null} userId - User ID (null for guest)
   * @param {object} cancellationData - Cancellation data (reason, requestRefund)
   * @returns {Promise<object>} Updated booking with refund info
   */
  async cancelBooking(bookingId, userId, cancellationData) {
    console.log(`[BookingService] Starting cancellation for booking ${bookingId}`);

    // STEP 1: Get booking and validate
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization - only owner can cancel (support both user_id and userId)
    const bookingUserId = booking.user_id || booking.userId;

    if (bookingUserId && bookingUserId !== userId && userId !== null) {
      console.error(
        `[BookingService] Unauthorized cancellation attempt by ${userId} for booking owned by ${bookingUserId}`
      );
      throw new Error('Unauthorized to cancel this booking');
    }

    // STEP 2: Get trip details for departure time
    const trip = await this.getTripById(booking.trip_id);
    if (!trip) {
      throw new Error('Trip information not found');
    }

    const departureTime = new Date(trip.schedule.departureTime || trip.schedule.departure_time);

    // STEP 3: Validate cancellation is allowed
    const validation = validateCancellation(booking, departureTime);

    if (!validation.valid) {
      console.error(`[BookingService] Cancellation validation failed: ${validation.error}`);
      throw new Error(validation.error);
    }

    // Prevent double cancellation with atomic check
    if (booking.status === 'cancelled') {
      console.warn(`[BookingService] Attempted double cancellation for booking ${bookingId}`);
      throw new Error('Booking is already cancelled');
    }

    // STEP 4: Calculate refund based on cancellation policy
    const refundCalculation = calculateRefundPolicy(booking, departureTime);

    console.log(`[BookingService] Refund calculation:`, {
      tier: refundCalculation.tier.name,
      refundAmount: refundCalculation.refundAmount,
      totalRefund: refundCalculation.totalRefund,
      canRefund: refundCalculation.canRefund,
    });

    // Determine final refund amount
    const finalRefundAmount =
      cancellationData.requestRefund !== false && refundCalculation.canRefund
        ? refundCalculation.totalRefund
        : 0;

    // STEP 5: Get passengers to release seats atomically
    const passengers = await passengerRepository.findByBookingId(bookingId);
    const seatCodes = passengers.map((p) => p.seat_code);

    // STEP 6: Cancel booking in database (atomic transaction)
    const cancelledBooking = await bookingRepository.cancel(bookingId, {
      reason: cancellationData.reason || 'Cancelled by user',
      refundAmount: finalRefundAmount,
    });

    console.log(`[BookingService] Booking ${bookingId} cancelled successfully`);

    // STEP 7: Clear expiration from Redis
    try {
      await redisClient.del(`booking:expiration:${bookingId}`);
      console.log(`[BookingService] Cleared expiration for booking ${bookingId}`);
    } catch (error) {
      console.error(`[BookingService] Failed to clear expiration from Redis:`, error);
      // Non-critical, continue
    }

    // STEP 8: Release seat locks atomically
    if (seatCodes.length > 0) {
      try {
        console.log(`[BookingService] Releasing locks for seats: ${seatCodes.join(', ')}`);
        await this.releaseLocksForCancelledBooking(booking.trip_id, seatCodes, bookingUserId);
        console.log(`[BookingService] Successfully released seat locks`);
      } catch (error) {
        console.error(`[BookingService] Failed to release seat locks:`, error);
        // Log error but don't fail cancellation - seats will be released by expiration
      }
    }

    // STEP 9: Send cancellation confirmation email
    try {
      await this.sendCancellationNotification({
        ...cancelledBooking,
        passengers,
        trip,
        refundDetails: {
          ...refundCalculation,
          finalRefundAmount,
        },
      });
      console.log(`[BookingService] Sent cancellation notification email`);
    } catch (error) {
      console.error(`[BookingService] Failed to send cancellation email:`, error);
      // Non-critical, continue
    }

    // Return complete cancellation result
    return {
      success: true,
      booking: cancelledBooking,
      refund: {
        tier: refundCalculation.tier.name,
        tierDescription: refundCalculation.tier.description,
        originalAmount: refundCalculation.originalAmount,
        refundAmount: refundCalculation.refundAmount,
        processingFee: refundCalculation.processingFee,
        totalRefund: finalRefundAmount,
        refundPercentage: refundCalculation.refundPercentage,
        canRefund: refundCalculation.canRefund,
        processingTime: finalRefundAmount > 0 ? '3-5 business days' : 'N/A',
        status: finalRefundAmount > 0 ? 'processing' : 'no_refund',
      },
      seatsReleased: seatCodes,
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
   * Process expired bookings (Enhanced with better logging and email notifications)
   * Automatically cancels unpaid bookings that have exceeded their lock time
   * @returns {Promise<number>} Number of bookings cancelled
   */
  async processExpiredBookings() {
    const startTime = Date.now();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⏰ [ExpirationJob] Starting expired bookings processing');
    console.log(`⏰ [ExpirationJob] Time: ${new Date().toISOString()}`);

    try {
      // STEP 1: Find all expired bookings (pending + unpaid + past locked_until)
      const expiredBookings = await bookingRepository.findExpiredBookings();

      if (expiredBookings.length === 0) {
        console.log('⏰ [ExpirationJob] No expired bookings found');
        console.log('═══════════════════════════════════════════════════════════');
        return 0;
      }

      console.log(`⏰ [ExpirationJob] Found ${expiredBookings.length} expired bookings`);

      let cancelledCount = 0;
      let failedCount = 0;
      const cancelledBookings = [];

      // STEP 2: Process each expired booking with proper error handling
      for (const booking of expiredBookings) {
        const bookingRef = booking.booking_reference;
        const bookingId = booking.booking_id;

        try {
          console.log(`⏰ [ExpirationJob] Processing booking ${bookingRef} (${bookingId})`);

          // Validate booking is actually expired and unpaid
          if (booking.status !== 'pending') {
            console.log(
              `⏰ [ExpirationJob] Skipping booking ${bookingRef}: status is ${booking.status}, not 'pending'`
            );
            continue;
          }

          if (booking.payment_status === 'paid') {
            console.log(`⏰ [ExpirationJob] Skipping booking ${bookingRef}: already paid`);
            continue;
          }

          // Get passengers before cancelling to know which seats to release
          const passengers = await passengerRepository.findByBookingId(bookingId);
          const seatCodes = passengers.map((p) => p.seat_code);

          console.log(
            `⏰ [ExpirationJob] Booking ${bookingRef}: ${seatCodes.length} seats - ${seatCodes.join(', ')}`
          );

          // Get trip details for email notification
          let trip = null;
          try {
            trip = await this.getTripById(booking.trip_id);
          } catch (error) {
            console.error(`⏰ [ExpirationJob] Failed to fetch trip details:`, error.message);
          }

          // STEP 3: Cancel booking (atomic transaction)
          await bookingRepository.cancel(bookingId, {
            reason: 'Booking expired - payment not received within time limit',
            refundAmount: 0,
          });

          console.log(`⏰ [ExpirationJob] Cancelled booking ${bookingRef} in database`);

          // STEP 4: Clear expiration from Redis
          try {
            await redisClient.del(`booking:expiration:${bookingId}`);
            console.log(`⏰ [ExpirationJob] Cleared Redis expiration for ${bookingRef}`);
          } catch (error) {
            console.error(
              `⏰ [ExpirationJob] Failed to clear Redis for ${bookingRef}:`,
              error.message
            );
            // Non-critical, continue
          }

          // STEP 5: Release seat locks atomically
          if (seatCodes.length > 0) {
            try {
              console.log(`⏰ [ExpirationJob] Releasing locks for seats: ${seatCodes.join(', ')}`);
              await this.releaseLocksForCancelledBooking(
                booking.trip_id,
                seatCodes,
                booking.user_id
              );
              console.log(`⏰ [ExpirationJob] Successfully released seat locks for ${bookingRef}`);
            } catch (error) {
              console.error(
                `⏰ [ExpirationJob] Failed to release seat locks for ${bookingRef}:`,
                error.message
              );
              // Log error but continue - seats will eventually be released
            }
          } else {
            console.warn(`⏰ [ExpirationJob] No seat codes found for booking ${bookingRef}`);
          }

          // STEP 6: Send expiration notification email to user
          try {
            await this.sendExpirationNotification({
              booking,
              passengers,
              trip,
            });
            console.log(`⏰ [ExpirationJob] Sent expiration email for ${bookingRef}`);
          } catch (error) {
            console.error(
              `⏰ [ExpirationJob] Failed to send expiration email for ${bookingRef}:`,
              error.message
            );
            // Non-critical, continue
          }

          cancelledCount++;
          cancelledBookings.push({
            reference: bookingRef,
            id: bookingId,
            seats: seatCodes.length,
          });

          console.log(`⏰ [ExpirationJob] ✅ Successfully processed booking ${bookingRef}`);
        } catch (error) {
          failedCount++;
          console.error(
            `⏰ [ExpirationJob] ❌ Failed to cancel expired booking ${bookingRef}:`,
            error.message
          );
          console.error(`⏰ [ExpirationJob] Error stack:`, error.stack);
          // Continue with next booking
        }
      }

      // STEP 7: Log summary
      const duration = Date.now() - startTime;
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`⏰ [ExpirationJob] Processing complete`);
      console.log(`⏰ [ExpirationJob] Duration: ${duration}ms`);
      console.log(`⏰ [ExpirationJob] Total found: ${expiredBookings.length}`);
      console.log(`⏰ [ExpirationJob] Successfully cancelled: ${cancelledCount}`);
      console.log(`⏰ [ExpirationJob] Failed: ${failedCount}`);

      if (cancelledBookings.length > 0) {
        console.log(`⏰ [ExpirationJob] Cancelled bookings:`);
        cancelledBookings.forEach((b) => {
          console.log(`   - ${b.reference} (${b.seats} seats)`);
        });
      }

      console.log('═══════════════════════════════════════════════════════════');

      return cancelledCount;
    } catch (error) {
      console.error('⏰ [ExpirationJob] Critical error in processExpiredBookings:', error);
      console.error('⏰ [ExpirationJob] Error stack:', error.stack);
      console.log('═══════════════════════════════════════════════════════════');
      return 0;
    }
  }

  /**
   * Send booking expiration notification email
   * @param {object} data - Expiration data
   */
  async sendExpirationNotification(data) {
    try {
      if (!data.booking.contact_email) {
        console.log('[BookingService] No contact email for expiration notification');
        return;
      }

      const notificationServiceUrl =
        process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

      await axios.post(`${notificationServiceUrl}/send-email`, {
        to: data.booking.contact_email,
        template: 'booking-expiration',
        data: {
          bookingReference: data.booking.booking_reference,
          expirationTime: data.booking.locked_until,
          trip: data.trip
            ? {
                origin: data.trip.route.origin,
                destination: data.trip.route.destination,
                departureTime: data.trip.schedule.departure_time,
              }
            : null,
        },
      });

      console.log('[BookingService] Sent expiration notification email');
    } catch (error) {
      console.error('Error sending expiration notification:', error.message);
      // Don't throw - email failure shouldn't fail the expiration process
    }
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

  /**
   * Get modification policy preview for a booking
   * Shows fees and what modifications are allowed
   * @param {string} bookingId - Booking UUID
   * @param {string|null} userId - User ID for authorization
   * @returns {Promise<object>} Modification policy and fee preview
   */
  async getModificationPreview(bookingId, userId = null) {
    const { getModificationTier, getAllModificationTiers } = require('../utils/modificationPolicy');

    // Get booking
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization
    const bookingUserId = booking.user_id || booking.userId;
    if (bookingUserId && bookingUserId !== userId && userId !== null) {
      throw new Error('Unauthorized to view this booking');
    }

    // Get trip details for departure time
    const trip = await this.getTripById(booking.trip_id);
    if (!trip) {
      throw new Error('Trip information not found');
    }

    const departureTime = new Date(trip.schedule.departureTime || trip.schedule.departure_time);

    // Get modification tier
    const tier = getModificationTier(departureTime);

    // Get current passengers
    const passengers = await passengerRepository.findByBookingId(bookingId);

    // Get all policy tiers for reference
    const policyTiers = getAllModificationTiers();

    return {
      canModify: tier.canModify,
      booking: {
        id: booking.booking_id,
        reference: booking.booking_reference,
        status: booking.status,
        totalPrice: parseFloat(booking.total_price),
      },
      trip: {
        departureTime: departureTime.toISOString(),
        hoursUntilDeparture: tier.hoursUntilDeparture,
      },
      currentPassengers: passengers.map((p) => ({
        ticketId: p.ticket_id,
        seatCode: p.seat_code,
        fullName: p.full_name,
        phone: p.phone,
        documentId: p.document_id,
      })),
      policy: {
        tier: tier.name,
        tierDescription: tier.description,
        baseFee: tier.modificationFee,
        seatChangeFee: tier.seatChangeFee,
        allowSeatChange: tier.allowSeatChange,
        allowPassengerUpdate: tier.allowPassengerUpdate,
      },
      policyTiers, // Include all tiers for user reference
    };
  }

  /**
   * Modify a booking (update passenger info or change seats)
   * @param {string} bookingId - Booking UUID
   * @param {string|null} userId - User ID for authorization
   * @param {object} modifications - Modification data
   * @returns {Promise<object>} Updated booking
   */
  async modifyBooking(bookingId, userId, modifications) {
    const {
      validateModification,
      calculateModificationFees,
    } = require('../utils/modificationPolicy');

    console.log(`[BookingService] Starting modification for booking ${bookingId}`);

    // STEP 1: Get booking and validate
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization
    const bookingUserId = booking.user_id || booking.userId;
    if (bookingUserId && bookingUserId !== userId && userId !== null) {
      console.error(
        `[BookingService] Unauthorized modification attempt by ${userId} for booking owned by ${bookingUserId}`
      );
      throw new Error('Unauthorized to modify this booking');
    }

    // STEP 2: Get trip details for departure time
    const trip = await this.getTripById(booking.trip_id);
    if (!trip) {
      throw new Error('Trip information not found');
    }

    const departureTime = new Date(trip.schedule.departureTime || trip.schedule.departure_time);

    // STEP 3: Validate modification is allowed
    const validation = validateModification(booking, departureTime, modifications);

    if (!validation.valid) {
      console.error(`[BookingService] Modification validation failed: ${validation.error}`);
      throw new Error(validation.error);
    }

    // STEP 4: Calculate modification fees
    const feeCalculation = calculateModificationFees(modifications, departureTime);

    if (!feeCalculation.canModify) {
      throw new Error('Modifications not allowed at this time');
    }

    console.log(`[BookingService] Modification fees:`, {
      baseFee: feeCalculation.baseFee,
      seatChangeFees: feeCalculation.seatChangeFees,
      totalFee: feeCalculation.totalFee,
    });

    // STEP 5: Process seat changes if requested
    let releasedSeats = [];
    let newSeats = [];

    if (modifications.seatChanges && modifications.seatChanges.length > 0) {
      const tripServiceUrl = process.env.TRIP_SERVICE_URL || 'http://localhost:3002';

      console.log(`[BookingService] Processing ${modifications.seatChanges.length} seat change(s)`);

      for (const seatChange of modifications.seatChanges) {
        const { ticketId, oldSeatCode, newSeatCode } = seatChange;

        console.log(
          `[BookingService] Seat change: ${oldSeatCode} → ${newSeatCode} for ticket ${ticketId}`
        );

        // Verify ticket exists in this booking
        const existingTicket = await passengerRepository.findByTicketId(ticketId);
        if (!existingTicket || existingTicket.booking_id !== bookingId) {
          throw new Error(
            `Ticket ${ticketId} not found in this booking. Please use the correct ticket ID from the modification preview.`
          );
        }

        // Validate new seat availability
        try {
          console.log(`[BookingService] Checking availability of seat ${newSeatCode}...`);
          const availabilityResponse = await axios.get(
            `${tripServiceUrl}/${booking.trip_id}/seats`,
            { timeout: 5000 }
          );

          const seatData = availabilityResponse.data.data || availabilityResponse.data;
          const seatMap = seatData.seat_map || seatData;
          const seats = seatMap.seats || seatMap;

          console.log(`[BookingService] Found ${seats.length} seats in trip`);

          const newSeat = seats.find((s) => s.seat_code === newSeatCode);

          if (!newSeat) {
            throw new Error(
              `Seat ${newSeatCode} does not exist in this trip. Available seats can be found in the seat map.`
            );
          }

          console.log(`[BookingService] Seat ${newSeatCode} status: ${newSeat.status}`);

          if (newSeat.status !== 'available') {
            throw new Error(
              `Seat ${newSeatCode} is ${newSeat.status}. Please choose an available seat.`
            );
          }

          console.log(`[BookingService] ✅ Seat ${newSeatCode} is available`);
        } catch (error) {
          console.error(`[BookingService] Seat availability check failed:`, error.message);
          // If the error already has a helpful message, use it; otherwise wrap it
          if (error.message.includes('Seat ') || error.message.includes('Ticket ')) {
            throw error;
          }
          throw new Error(`Failed to verify seat availability: ${error.message}`);
        }

        // Lock new seat
        try {
          await axios.post(
            `${tripServiceUrl}/${booking.trip_id}/seats/lock`,
            {
              seatCodes: [newSeatCode],
              sessionId: bookingUserId || `booking_${bookingId}`,
            },
            { timeout: 5000 }
          );
          newSeats.push(newSeatCode);
        } catch (error) {
          // Rollback any previously locked seats
          if (newSeats.length > 0) {
            await this.releaseLocksForCancelledBooking(booking.trip_id, newSeats, bookingUserId);
          }
          throw new Error(`Failed to lock new seat ${newSeatCode}: ${error.message}`);
        }

        // Update passenger seat in database
        await passengerRepository.updateSeat(ticketId, newSeatCode);

        releasedSeats.push(oldSeatCode);
      }

      // Release old seat locks
      if (releasedSeats.length > 0) {
        await this.releaseLocksForCancelledBooking(booking.trip_id, releasedSeats, bookingUserId);
      }
    }

    // STEP 6: Process passenger information updates
    if (modifications.passengerUpdates && modifications.passengerUpdates.length > 0) {
      for (const passengerUpdate of modifications.passengerUpdates) {
        const { ticketId, fullName, phone, documentId } = passengerUpdate;

        await passengerRepository.update(ticketId, {
          full_name: fullName,
          phone,
          document_id: documentId,
        });
      }
    }

    // STEP 7: Update booking with modification fee
    const newTotalPrice = parseFloat(booking.total_price) + feeCalculation.totalFee;

    await bookingRepository.updateModificationFee(bookingId, {
      modificationFee: feeCalculation.totalFee,
      newTotalPrice: formatPrice(newTotalPrice),
    });

    // STEP 8: Regenerate e-ticket with updated information
    let newTicketUrl = booking.ticket_url;
    try {
      const ticketService = require('./ticketService');
      const updatedBooking = await bookingRepository.findById(bookingId);
      const updatedPassengers = await passengerRepository.findByBookingId(bookingId);

      const ticketResult = await ticketService.generateTicket({
        ...updatedBooking,
        passengers: updatedPassengers,
        trip,
      });

      newTicketUrl = ticketResult.ticketUrl;

      // Update booking with new ticket URL
      await bookingRepository.updateTicketUrl(bookingId, ticketResult.ticketUrl);
    } catch (error) {
      console.error('[BookingService] Failed to regenerate ticket:', error);
      // Non-critical, continue
    }

    // STEP 9: Send modification confirmation email
    try {
      const updatedBooking = await bookingRepository.findById(bookingId);
      const updatedPassengers = await passengerRepository.findByBookingId(bookingId);

      await this.sendModificationNotification({
        booking: updatedBooking,
        passengers: updatedPassengers,
        trip,
        modifications: {
          seatChanges: modifications.seatChanges || [],
          passengerUpdates: modifications.passengerUpdates || [],
        },
        fees: feeCalculation,
      });
    } catch (error) {
      console.error('[BookingService] Failed to send modification email:', error);
      // Non-critical, continue
    }

    console.log(`[BookingService] Booking ${bookingId} modified successfully`);

    // Return complete modification result
    const finalBooking = await bookingRepository.findById(bookingId);
    const finalPassengers = await passengerRepository.findByBookingId(bookingId);

    return {
      success: true,
      booking: finalBooking,
      passengers: finalPassengers,
      modifications: {
        seatChanges: modifications.seatChanges || [],
        passengerUpdates: modifications.passengerUpdates || [],
      },
      fees: {
        baseFee: feeCalculation.baseFee,
        seatChangeFees: feeCalculation.seatChangeFees,
        totalFee: feeCalculation.totalFee,
        newTotalPrice,
      },
      ticketUrl: newTicketUrl,
    };
  }

  /**
   * Send modification notification email
   * @param {object} data - Modification data
   */
  async sendModificationNotification(data) {
    try {
      const notificationServiceUrl =
        process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

      await axios.post(`${notificationServiceUrl}/send-email`, {
        to: data.booking.contact_email,
        template: 'booking-modification',
        data: {
          bookingReference: data.booking.booking_reference,
          modifications: data.modifications,
          fees: data.fees,
          trip: {
            origin: data.trip.route.origin,
            destination: data.trip.route.destination,
            departureTime: data.trip.schedule.departure_time,
          },
        },
      });

      console.log('[BookingService] Sent modification notification email');
    } catch (error) {
      console.error('Error sending modification notification:', error.message);
      // Don't throw - email failure shouldn't fail the modification
    }
  }
}

module.exports = new BookingService();
