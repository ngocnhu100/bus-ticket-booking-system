/**
 * Booking Cache Controller
 * Handles session caching endpoints for seat selection and booking drafts
 */

const BookingSessionManager = require('../sessionManager');

/**
 * Save seat selection
 * POST /api/booking/seats/select
 */
const saveSeatSelection = async (req, res) => {
  try {
    const { sessionId, tripId, selectedSeats } = req.body;

    if (!sessionId || !tripId || !selectedSeats || !Array.isArray(selectedSeats)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'sessionId, tripId, and selectedSeats array required',
        },
      });
    }

    const seatData = {
      tripId,
      selectedSeats,
      selectedAt: new Date().toISOString(),
    };

    const saved = await BookingSessionManager.saveSeatSelection(sessionId, seatData);
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: { code: 'SEAT_SAVE_FAILED', message: 'Failed to save seat selection' },
      });
    }

    res.json({
      success: true,
      message: 'Seat selection saved',
      data: { sessionId, tripId, selectedSeats },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SEAT_SELECTION_ERROR', message: error.message },
    });
  }
};

/**
 * Get seat selection
 * GET /api/booking/seats/selection/:sessionId
 */
const getSeatSelection = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const seatData = await BookingSessionManager.getSeatSelection(sessionId);
    if (!seatData) {
      return res.json({
        success: true,
        data: null,
        message: 'No seat selection found',
      });
    }

    res.json({
      success: true,
      data: seatData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SEAT_RETRIEVAL_ERROR', message: error.message },
    });
  }
};

/**
 * Create booking draft
 * POST /api/booking/draft
 */
const createBookingDraft = async (req, res) => {
  try {
    const { sessionId, tripId, seats, passengers, contactEmail, contactPhone } = req.body;

    if (!sessionId || !tripId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'sessionId and tripId required' },
      });
    }

    const draftData = {
      tripId,
      seats: seats || [],
      passengers: passengers || [],
      contactEmail,
      contactPhone,
      savedAt: new Date().toISOString(),
    };

    const saved = await BookingSessionManager.createBookingDraft(sessionId, draftData);
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: { code: 'DRAFT_SAVE_FAILED', message: 'Failed to save booking draft' },
      });
    }

    res.json({
      success: true,
      message: 'Booking draft saved',
      data: draftData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DRAFT_SAVE_ERROR', message: error.message },
    });
  }
};

/**
 * Get booking draft
 * GET /api/booking/draft/:sessionId
 */
const getBookingDraft = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const draftData = await BookingSessionManager.getBookingDraft(sessionId);
    if (!draftData) {
      return res.json({
        success: true,
        data: null,
        message: 'No booking draft found',
      });
    }

    res.json({
      success: true,
      data: draftData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DRAFT_RETRIEVAL_ERROR', message: error.message },
    });
  }
};

/**
 * Clear booking draft
 * DELETE /api/booking/draft/:sessionId
 */
const clearBookingDraft = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'sessionId is required',
        },
      });
    }

    const cleared = await BookingSessionManager.clearBookingSession(sessionId);

    res.json({
      success: true,
      message: `Booking draft cleared for: ${sessionId}`,
      cleared,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DRAFT_CLEAR_ERROR', message: error.message },
    });
  }
};

/**
 * Get session statistics
 * GET /api/booking/session/stats (Admin only)
 */
const getSessionStats = async (req, res) => {
  try {
    const stats = await BookingSessionManager.getSessionStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SESSION_STATS_ERROR', message: error.message },
    });
  }
};

/**
 * Clear booking session
 * DELETE /api/booking/session/clear (Admin only)
 */
const clearSession = async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'sessionId is required' },
      });
    }

    const cleared = await BookingSessionManager.clearBookingSession(sessionId);
    res.json({
      success: true,
      message: `Booking session cleared for: ${sessionId}`,
      cleared,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SESSION_CLEAR_ERROR', message: error.message },
    });
  }
};

/**
 * List all active sessions
 * GET /api/booking/sessions (Admin only)
 */
const listSessions = async (req, res) => {
  try {
    const redisClient = require('../redis');

    // Get all seat selection sessions
    const seatKeys = await redisClient.keys('seat:selection:*');
    const draftKeys = await redisClient.keys('booking:draft:*');

    const sessions = [];

    // Fetch seat selection data with TTL
    for (const key of seatKeys) {
      const sessionId = key.replace('seat:selection:', '');
      const seatData = await redisClient.get(key);
      const ttl = await redisClient.ttl(key);

      sessions.push({
        sessionId,
        type: 'seat_selection',
        data: seatData ? JSON.parse(seatData) : null,
        ttl: ttl > 0 ? ttl : 'expired',
        key,
      });
    }

    // Fetch booking draft data with TTL
    for (const key of draftKeys) {
      const sessionId = key.replace('booking:draft:', '');
      const draftData = await redisClient.get(key);
      const ttl = await redisClient.ttl(key);

      sessions.push({
        sessionId,
        type: 'booking_draft',
        data: draftData ? JSON.parse(draftData) : null,
        ttl: ttl > 0 ? ttl : 'expired',
        key,
      });
    }

    res.json({
      success: true,
      totalSessions: sessions.length,
      seatSelectionCount: seatKeys.length,
      bookingDraftCount: draftKeys.length,
      sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LIST_SESSIONS_ERROR', message: error.message },
    });
  }
};

/**
 * Save pending payment
 * POST /api/bookings/pending-payment
 */
const savePendingPayment = async (req, res) => {
  try {
    console.log('[bookingCacheController] savePendingPayment - req.body type:', typeof req.body);
    console.log('[bookingCacheController] savePendingPayment - req.body:', req.body);

    // Handle both JSON body and sendBeacon (which sends Blob as text)
    let sessionId, bookingId, paymentData;

    if (req.body && typeof req.body === 'object') {
      // Regular JSON POST
      sessionId = req.body.sessionId;
      bookingId = req.body.bookingId;
      paymentData = req.body.paymentData;
      console.log('[bookingCacheController] Parsed as object');
    } else if (typeof req.body === 'string') {
      // sendBeacon sends as text/plain or application/json
      console.log('[bookingCacheController] Parsing as string...');
      try {
        const parsed = JSON.parse(req.body);
        sessionId = parsed.sessionId;
        bookingId = parsed.bookingId;
        paymentData = parsed.paymentData;
        console.log('[bookingCacheController] Successfully parsed JSON string');
      } catch (parseErr) {
        console.error('[bookingCacheController] Failed to parse text body:', parseErr);
        sessionId = req.body.sessionId;
        bookingId = req.body.bookingId;
        paymentData = req.body.paymentData;
      }
    }

    console.log('[bookingCacheController] savePendingPayment called:', {
      sessionId,
      bookingId,
      hasPaymentData: !!paymentData,
      paymentDataKeys: paymentData ? Object.keys(paymentData) : [],
    });

    if (!sessionId || !bookingId || !paymentData) {
      console.error('[bookingCacheController] Missing required fields:', {
        sessionId: !!sessionId,
        bookingId: !!bookingId,
        paymentData: !!paymentData,
      });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'sessionId, bookingId, and paymentData required',
        },
      });
    }

    const paymentPayload = {
      bookingId,
      sessionId,
      paymentUrl: paymentData.paymentUrl,
      qrCode: paymentData.qrCode,
      provider: paymentData.provider,
      clientSecret: paymentData.clientSecret,
      savedAt: new Date().toISOString(),
    };

    console.log('[bookingCacheController] Saving to Redis:', { sessionId, bookingId });
    const saved = await BookingSessionManager.savePendingPayment(sessionId, paymentPayload);
    if (!saved) {
      console.error('[bookingCacheController] Failed to save pending payment');
      return res.status(500).json({
        success: false,
        error: { code: 'PAYMENT_SAVE_FAILED', message: 'Failed to save pending payment' },
      });
    }

    console.log('[bookingCacheController] ✅ Pending payment saved successfully');
    res.json({
      success: true,
      message: 'Pending payment saved',
      data: { sessionId, bookingId },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'PENDING_PAYMENT_SAVE_ERROR', message: error.message },
    });
  }
};

/**
 * Get pending payment
 * GET /api/bookings/pending-payment/:sessionId
 */
const getPendingPayment = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SESSION_ID', message: 'sessionId required' },
      });
    }

    const paymentData = await BookingSessionManager.getPendingPayment(sessionId);

    if (!paymentData) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'No pending payment found' },
      });
    }

    res.json({
      success: true,
      data: paymentData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'PENDING_PAYMENT_FETCH_ERROR', message: error.message },
    });
  }
};

/**
 * Clear pending payment
 * DELETE /api/bookings/pending-payment/:sessionId
 */
const clearPendingPayment = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SESSION_ID', message: 'sessionId required' },
      });
    }

    const cleared = await BookingSessionManager.clearPendingPayment(sessionId);

    res.json({
      success: true,
      message: 'Pending payment cleared',
      data: { sessionId, cleared },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'PENDING_PAYMENT_CLEAR_ERROR', message: error.message },
    });
  }
};

module.exports = {
  saveSeatSelection,
  getSeatSelection,
  createBookingDraft,
  getBookingDraft,
  clearBookingDraft,
  getSessionStats,
  clearSession,
  listSessions,
  savePendingPayment,
  getPendingPayment,
  clearPendingPayment,
};
