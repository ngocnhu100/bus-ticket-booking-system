const bookingRepository = require('./bookingRepository');
const redisClient = require('./redis');
const ticketService = require('./services/ticketService');

class BookingService {
  /**
   * Generate unique booking reference with format: BK + YYYYMMDD + sequence
   * Example: BK20251207001
   * Uses Redis INCR for concurrency-safe sequence generation
   */
  async generateBookingReference() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}${month}${day}`;
    
    // Redis key for daily sequence counter
    const redisKey = `booking:sequence:${dateKey}`;
    
    // Atomic increment with retry logic for uniqueness
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        // Get next sequence number (atomic operation)
        const sequence = await redisClient.incr(redisKey);
        
        // Set expiry to 48 hours (to clean up old keys)
        if (sequence === 1) {
          await redisClient.expire(redisKey, 48 * 60 * 60);
        }
        
        // Format: BK + YYYYMMDD + 3-digit sequence
        const sequenceStr = String(sequence).padStart(3, '0');
        const bookingReference = `BK${dateKey}${sequenceStr}`;
        
        // Verify uniqueness in database
        const exists = await bookingRepository.checkReferenceExists(bookingReference);
        if (!exists) {
          return bookingReference;
        }
        
        // If exists (edge case), retry with next sequence
        attempts++;
      } catch (error) {
        console.error('Error generating booking reference:', error);
        attempts++;
        
        // Fallback to timestamp-based if Redis fails
        if (attempts >= maxAttempts) {
          const timestamp = Date.now().toString().slice(-6);
          return `BK${dateKey}${timestamp}`;
        }
      }
    }
    
    throw new Error('Failed to generate unique booking reference after maximum attempts');
  }

  async lockSeats(tripId, seatNumbers, duration = 600) {
    // Lock seats in Redis for 10 minutes (600 seconds)
    const lockKey = `seat:lock:${tripId}`;
    const promises = seatNumbers.map(async (seat) => {
      const seatKey = `${lockKey}:${seat}`;
      const sessionId = `session:${Date.now()}:${Math.random()}`;
      await redisClient.setEx(seatKey, duration, sessionId);
      return { seat, sessionId };
    });

    return await Promise.all(promises);
  }

  async checkSeatsLocked(tripId, seatNumbers) {
    const lockKey = `seat:lock:${tripId}`;
    const promises = seatNumbers.map(async (seat) => {
      const seatKey = `${lockKey}:${seat}`;
      const locked = await redisClient.exists(seatKey);
      return { seat, locked: locked === 1 };
    });

    return await Promise.all(promises);
  }

  async unlockSeats(tripId, seatNumbers) {
    const lockKey = `seat:lock:${tripId}`;
    const promises = seatNumbers.map(async (seat) => {
      const seatKey = `${lockKey}:${seat}`;
      await redisClient.del(seatKey);
    });

    await Promise.all(promises);
  }

  async createBooking(bookingData, userId = null) {
    const { tripId, passengers, totalPrice, paymentMethod, isGuestCheckout, contactEmail, contactPhone } = bookingData;

    // Extract seat numbers
    const seatNumbers = passengers.map(p => p.seatNumber);

    // Check seat availability in database
    const occupiedSeats = await bookingRepository.checkSeatAvailability(tripId, seatNumbers);
    if (occupiedSeats.length > 0) {
      throw new Error(`Seats already booked: ${occupiedSeats.join(', ')}`);
    }

    // Check if seats are locked in Redis
    const lockedSeats = await this.checkSeatsLocked(tripId, seatNumbers);
    const alreadyLocked = lockedSeats.filter(s => s.locked).map(s => s.seat);
    if (alreadyLocked.length > 0) {
      throw new Error(`Seats currently locked: ${alreadyLocked.join(', ')}`);
    }

    // Lock seats
    await this.lockSeats(tripId, seatNumbers);

    // Calculate pricing
    const serviceFee = totalPrice * 0.05; // 5% service fee
    const subtotal = totalPrice - serviceFee;

    // Generate unique booking reference (async, concurrency-safe)
    const bookingReference = await this.generateBookingReference();

    // Create booking with 10 minute lock
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const booking = await bookingRepository.createBooking({
      bookingReference,
      tripId,
      userId: isGuestCheckout ? null : userId,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      subtotal,
      serviceFee,
      totalPrice,
      paymentMethod,
      lockedUntil
    });

    // Add passengers
    const passengerRecords = await bookingRepository.addPassengers(booking.booking_id, passengers);

    return {
      ...booking,
      passengers: passengerRecords,
      isGuestCheckout
    };
  }

  async getBookingByReference(bookingReference) {
    return await bookingRepository.findByReference(bookingReference);
  }

  async getBookingByReferenceAndContact(bookingReference, contactEmail, contactPhone) {
    // Verify at least one contact method matches
    const booking = await bookingRepository.findByReference(bookingReference);
    
    if (!booking) {
      return null;
    }
    
    // Check if either email or phone matches
    const emailMatches = contactEmail && booking.contact_email && 
                        booking.contact_email.toLowerCase() === contactEmail.toLowerCase();
    const phoneMatches = contactPhone && booking.contact_phone && 
                        booking.contact_phone.replace(/\s/g, '') === contactPhone.replace(/\s/g, '');
    
    if (!emailMatches && !phoneMatches) {
      // Contact info doesn't match - return null (security: don't reveal booking exists)
      return null;
    }
    
    return booking;
  }

  async lookupGuestBooking(bookingReference, contactEmail, contactPhone) {
    return await bookingRepository.findByReferenceAndContact(bookingReference, contactEmail, contactPhone);
  }

  async getUserBookings(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return await bookingRepository.findByUserId(userId, limit, offset);
  }

  /**
   * Confirm booking and trigger ticket generation
   * @param {string} bookingId - Booking UUID
   * @returns {Promise<object>} Confirmed booking with ticket info
   */
  async confirmBooking(bookingId) {
    try {
      console.log(`✅ Confirming booking: ${bookingId}`);

      // 1. Update booking status to confirmed
      const confirmedBooking = await bookingRepository.confirmBooking(bookingId);

      if (!confirmedBooking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }

      // 2. Generate ticket asynchronously (non-blocking)
      // If ticket generation fails, booking is still confirmed
      ticketService.processTicketGeneration(bookingId)
        .then(() => {
          console.log(`✅ Ticket generated successfully for: ${confirmedBooking.booking_reference}`);
        })
        .catch(error => {
          console.error(`❌ Ticket generation failed for ${confirmedBooking.booking_reference}:`, error.message);
          // Log but don't throw - booking confirmation succeeded
        });

      console.log(`✅ Booking confirmed: ${confirmedBooking.booking_reference}`);

      return confirmedBooking;
    } catch (error) {
      console.error(`❌ Error confirming booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Get booking by ID with ticket info
   * @param {string} bookingId - Booking UUID
   * @returns {Promise<object>} Booking with eTicket info
   */
  async getBookingById(bookingId) {
    const booking = await bookingRepository.findById(bookingId);
    
    if (!booking) {
      return null;
    }

    // Format response with eTicket
    return {
      ...booking,
      eTicket: {
        ticketUrl: booking.ticket_url || null,
        qrCode: booking.qr_code_url || null
      }
    };
  }
}

module.exports = new BookingService();
