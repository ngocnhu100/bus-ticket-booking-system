const axios = require('axios');
const bookingRepository = require('../repositories/bookingRepository');
const passengerRepository = require('../repositories/passengerRepository');
const redisClient = require('../redis');
const {
  generateBookingReference,
  calculateServiceFee,
  calculateLockExpiration,
  formatPrice
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
      console.warn(`[BookingService] Duplicate booking reference generated: ${bookingReference}, attempt ${attempts}/${maxAttempts}`);
      
      // Add small delay to avoid collision in high concurrency
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    if (attempts >= maxAttempts) {
      console.error('[BookingService] Failed to generate unique booking reference after max attempts');
      throw new Error('BOOKING_REFERENCE_GENERATION_FAILED: Unable to generate unique reference. Please try again.');
    }
    
    console.log(`[BookingService] Generated unique booking reference: ${bookingReference} (attempts: ${attempts + 1})`);
    
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
      currency: 'VND'
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
        price: seatPrice  // Ensure price is always set from trip pricing
      };
    });
    
    const createdPassengers = await passengerRepository.createBatch(
      booking.bookingId,
      passengerRecords
    );
    
    // 7. Schedule expiration check in Redis
    await this.scheduleBookingExpiration(booking.bookingId, booking.lockedUntil);
    
    // 8. Return complete booking
    return {
      ...booking,
      passengers: createdPassengers,
      tripDetails: {
        tripId: trip.tripId,
        route: trip.route,
        operator: trip.operator,
        departureTime: trip.schedule.departureTime,
        arrivalTime: trip.schedule.arrivalTime
      }
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
      tripDetails: trip ? {
        tripId: trip.tripId,
        route: trip.route,
        operator: trip.operator,
        bus: trip.bus,
        schedule: trip.schedule
      } : null
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
    if (!booking.userId && booking.contactEmail !== contactEmail) {
      throw new Error('Invalid booking reference or email');
    }
    
    // Get passengers
    const passengers = await passengerRepository.findByBookingId(booking.bookingId);
    
    // Get trip details
    const trip = await this.getTripById(booking.tripId);
    
    return {
      ...booking,
      passengers,
      tripDetails: trip
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
    // Find booking by reference
    const booking = await bookingRepository.findByReference(bookingReference);
    
    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND');
    }
    
    // Verify contact information (phone OR email must match)
    let isVerified = false;
    
    if (phone && booking.contactPhone) {
      // Normalize phone numbers for comparison (remove spaces, handle +84/0 prefix)
      const normalizePhone = (p) => p.replace(/\s+/g, '').replace(/^0/, '+84');
      isVerified = normalizePhone(booking.contactPhone) === normalizePhone(phone);
    }
    
    if (!isVerified && email && booking.contactEmail) {
      // Case-insensitive email comparison
      isVerified = booking.contactEmail.toLowerCase() === email.toLowerCase();
    }
    
    if (!isVerified) {
      throw new Error('CONTACT_MISMATCH');
    }
    
    // Get passengers
    const passengers = await passengerRepository.findByBookingId(booking.bookingId);
    
    // Get trip details
    const trip = await this.getTripById(booking.tripId);
    
    return {
      ...booking,
      passengers,
      tripDetails: trip ? {
        tripId: trip.tripId,
        route: trip.route,
        operator: trip.operator,
        bus: trip.bus,
        schedule: trip.schedule
      } : null
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
        const passengers = await passengerRepository.findByBookingId(booking.bookingId);
        return {
          ...booking,
          passengersCount: passengers.length,
          seatCodes: passengers.map(p => p.seatCode)
        };
      })
    );
    
    return {
      bookings: enrichedBookings,
      pagination: result.pagination
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
      paidAt: new Date()
    });
    
    // Clear expiration from Redis
    await redisClient.del(`booking:expiration:${bookingId}`);
    
    // Send confirmation notification
    await this.sendBookingConfirmation(updatedBooking);
    
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
      refundAmount: cancellationData.requestRefund ? refundAmount : 0
    });
    
    // Clear expiration from Redis
    await redisClient.del(`booking:expiration:${bookingId}`);
    
    // Send cancellation notification
    await this.sendCancellationNotification(cancelledBooking);
    
    return {
      ...cancelledBooking,
      refund: {
        amount: refundAmount,
        percentage: this.calculateRefundPercentage(booking),
        processingTime: '3-5 business days'
      }
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
    const trip = await this.getTripById(booking.tripId);
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
  calculateRefundPercentage(booking) {
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
        await bookingRepository.cancel(booking.bookingId, {
          reason: 'Booking expired - payment not received',
          refundAmount: 0
        });
        
        await redisClient.del(`booking:expiration:${booking.bookingId}`);
        cancelledCount++;
      } catch (error) {
        console.error(`Failed to cancel expired booking ${booking.bookingId}:`, error);
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
      const tripServiceUrl = process.env.TRIP_SERVICE_URL || 'http://localhost:3002';
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
   * Send booking confirmation notification
   * @param {object} booking - Booking object
   */
  async sendBookingConfirmation(booking) {
    try {
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
      await axios.post(`${notificationServiceUrl}/send-email`, {
        to: booking.contactEmail,
        template: 'booking-confirmation',
        data: {
          bookingReference: booking.bookingReference,
          bookingId: booking.bookingId
        }
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
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
      await axios.post(`${notificationServiceUrl}/send-email`, {
        to: booking.contactEmail,
        template: 'booking-cancellation',
        data: {
          bookingReference: booking.bookingReference,
          refundAmount: booking.cancellation?.refundAmount || 0
        }
      });
    } catch (error) {
      console.error('Error sending cancellation notification:', error.message);
    }
  }
}

module.exports = new BookingService();
