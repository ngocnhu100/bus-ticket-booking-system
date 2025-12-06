const bookingRepository = require('./bookingRepository');
const redisClient = require('./redis');

class BookingService {
  generateBookingReference() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BK${year}${month}${day}${random}`;
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

    // Generate booking reference
    const bookingReference = this.generateBookingReference();

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

  async lookupGuestBooking(bookingReference, contactEmail, contactPhone) {
    return await bookingRepository.findByReferenceAndContact(bookingReference, contactEmail, contactPhone);
  }

  async getUserBookings(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return await bookingRepository.findByUserId(userId, limit, offset);
  }
}

module.exports = new BookingService();
