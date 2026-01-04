const redisClient = require('./redis');

// TTL Configuration (in seconds)
const TTL_CONFIG = {
  BOOKING_DRAFT: parseInt(process.env.TTL_BOOKING_DRAFT) || 30 * 60, // 30 minutes
  SEAT_SELECTION: parseInt(process.env.TTL_SEAT_SELECTION) || 15 * 60, // 15 minutes
  PAYMENT_STATUS: parseInt(process.env.TTL_PAYMENT_STATUS) || 60 * 60, // 1 hour
  USER_SESSION: parseInt(process.env.TTL_USER_SESSION) || 24 * 60 * 60, // 24 hours
};

/**
 * Session Manager for booking service
 * Handles booking session data, payment status, and temporary booking data
 */
class BookingSessionManager {
  /**
   * Create/update booking session (temporary booking draft)
   * @param {string} sessionId - Session ID (guest or user)
   * @param {Object} bookingDraft - Booking draft data
   * @param {number} ttl - Time to live in seconds (default: from config)
   * @returns {Promise<boolean>}
   */
  static async createBookingDraft(sessionId, bookingDraft, ttl = TTL_CONFIG.BOOKING_DRAFT) {
    try {
      const sessionKey = `booking:draft:${sessionId}`;
      const draftJson = JSON.stringify({
        ...bookingDraft,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });

      await redisClient.setEx(sessionKey, ttl, draftJson);
      console.log(`✅ Booking draft created for session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to create booking draft:', error.message);
      return false;
    }
  }

  /**
   * Get booking draft
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>}
   */
  static async getBookingDraft(sessionId) {
    try {
      const sessionKey = `booking:draft:${sessionId}`;
      const draftData = await redisClient.get(sessionKey);

      if (!draftData) return null;
      return JSON.parse(draftData);
    } catch (error) {
      console.error('❌ Failed to get booking draft:', error.message);
      return null;
    }
  }

  /**
   * Update booking draft
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<boolean>}
   */
  static async updateBookingDraft(sessionId, updates) {
    try {
      const sessionKey = `booking:draft:${sessionId}`;
      const draft = await this.getBookingDraft(sessionId);

      if (!draft) {
        console.warn('⚠️ Booking draft not found:', sessionId);
        return false;
      }

      const updated = {
        ...draft,
        ...updates,
        lastModified: new Date().toISOString(),
      };

      await redisClient.setEx(sessionKey, TTL_CONFIG.BOOKING_DRAFT, JSON.stringify(updated));
      console.log(`✅ Booking draft updated for session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update booking draft:', error.message);
      return false;
    }
  }

  /**
   * Store payment status temporarily
   * @param {string} bookingId - Booking ID
   * @param {Object} paymentData - Payment status data
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   * @returns {Promise<boolean>}
   */
  static async savePaymentStatus(bookingId, paymentData, ttl = TTL_CONFIG.PAYMENT_STATUS) {
    try {
      const paymentKey = `payment:status:${bookingId}`;
      const paymentJson = JSON.stringify({
        ...paymentData,
        savedAt: new Date().toISOString(),
      });

      await redisClient.setEx(paymentKey, ttl, paymentJson);
      console.log(`✅ Payment status saved for booking: ${bookingId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save payment status:', error.message);
      return false;
    }
  }

  /**
   * Get payment status
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object|null>}
   */
  static async getPaymentStatus(bookingId) {
    try {
      const paymentKey = `payment:status:${bookingId}`;
      const paymentData = await redisClient.get(paymentKey);

      if (!paymentData) return null;
      return JSON.parse(paymentData);
    } catch (error) {
      console.error('❌ Failed to get payment status:', error.message);
      return null;
    }
  }

  /**
   * Store seat selection session
   * @param {string} sessionId - Session ID
   * @param {Object} seatData - Selected seats data
   * @param {number} ttl - Time to live in seconds (default: 15 minutes)
   * @returns {Promise<boolean>}
   */
  static async saveSeatSelection(sessionId, seatData, ttl = TTL_CONFIG.SEAT_SELECTION) {
    try {
      const seatKey = `seat:selection:${sessionId}`;
      const seatJson = JSON.stringify({
        ...seatData,
        selectedAt: new Date().toISOString(),
      });

      await redisClient.setEx(seatKey, ttl, seatJson);
      console.log(`✅ Seat selection saved for session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save seat selection:', error.message);
      return false;
    }
  }

  /**
   * Get seat selection
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>}
   */
  static async getSeatSelection(sessionId) {
    try {
      const seatKey = `seat:selection:${sessionId}`;
      const seatData = await redisClient.get(seatKey);

      if (!seatData) return null;
      return JSON.parse(seatData);
    } catch (error) {
      console.error('❌ Failed to get seat selection:', error.message);
      return null;
    }
  }

  /**
   * Clear booking session (after confirmation)
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>}
   */
  static async clearBookingSession(sessionId) {
    try {
      const keys = [
        `booking:draft:${sessionId}`,
        `seat:selection:${sessionId}`,
        `payment:status:${sessionId}`,
      ];

      await redisClient.del(keys);
      console.log(`✅ Booking session cleared for: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to clear booking session:', error.message);
      return false;
    }
  }

  /**
   * Save pending payment
   * @param {string} sessionId - Session ID
   * @param {Object} paymentData - Payment data
   * @param {number} ttl - Time to live in seconds (default: from config)
   * @returns {Promise<boolean>}
   */
  static async savePendingPayment(sessionId, paymentData, ttl = TTL_CONFIG.PAYMENT_STATUS) {
    try {
      const paymentKey = `payment:status:${sessionId}`;
      const paymentJson = JSON.stringify({
        ...paymentData,
        savedAt: new Date().toISOString(),
      });

      await redisClient.setEx(paymentKey, ttl, paymentJson);
      console.log(`✅ Pending payment saved for session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save pending payment:', error.message);
      return false;
    }
  }

  /**
   * Get pending payment
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>}
   */
  static async getPendingPayment(sessionId) {
    try {
      const paymentKey = `payment:status:${sessionId}`;
      const paymentData = await redisClient.get(paymentKey);

      if (!paymentData) {
        return null;
      }

      return JSON.parse(paymentData);
    } catch (error) {
      console.error('❌ Failed to get pending payment:', error.message);
      return null;
    }
  }

  /**
   * Clear pending payment
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>}
   */
  static async clearPendingPayment(sessionId) {
    try {
      const paymentKey = `payment:status:${sessionId}`;
      await redisClient.del(paymentKey);
      console.log(`✅ Pending payment cleared for session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to clear pending payment:', error.message);
      return false;
    }
  }

  /**
   * Get booking session statistics
   * @returns {Promise<Object>}
   */
  static async getSessionStats() {
    try {
      console.log('🔍 Getting session stats...');
      const draftKeys = await redisClient.keys('booking:draft:*');
      const seatKeys = await redisClient.keys('seat:selection:*');
      const paymentKeys = await redisClient.keys('payment:status:*');

      console.log(
        `📊 Session stats: drafts=${draftKeys.length}, seats=${seatKeys.length}, payments=${paymentKeys.length}`
      );

      return {
        draftBookings: draftKeys.length,
        activeSeatSessions: seatKeys.length,
        pendingPayments: paymentKeys.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to get session stats:', error.message);
      return { error: error.message };
    }
  }
}

module.exports = BookingSessionManager;
