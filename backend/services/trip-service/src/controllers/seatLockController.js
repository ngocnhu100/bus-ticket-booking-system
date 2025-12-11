// controllers/seatLockController.js
const seatLockService = require('../services/seatLockService');
const Joi = require('joi');

class SeatLockController {
  constructor() {
    // Validation schemas
    this.lockSeatsSchema = Joi.object({
      seatCodes: Joi.array().items(Joi.string().required()).min(1).max(10).required(),
      sessionId: Joi.string().optional(),
      isGuest: Joi.boolean().optional().default(false),
    }).unknown(false);

    this.extendLocksSchema = Joi.object({
      seatCodes: Joi.array().items(Joi.string().required()).min(1).max(10).required(),
      sessionId: Joi.string().optional(),
      isGuest: Joi.boolean().optional().default(false),
    }).unknown(false);

    this.releaseLocksSchema = Joi.object({
      seatCodes: Joi.array().items(Joi.string().required()).min(1).max(10).required(),
      sessionId: Joi.string().optional(),
      isGuest: Joi.boolean().optional().default(false),
    }).unknown(false);

    this.releaseAllLocksSchema = Joi.object({
      sessionId: Joi.string().optional(),
      isGuest: Joi.boolean().optional().default(false),
    }).unknown(false);

    // Bind methods to ensure correct 'this' context
    this.lockSeats = this.lockSeats.bind(this);
    this.extendLocks = this.extendLocks.bind(this);
    this.releaseLocks = this.releaseLocks.bind(this);
    this.releaseAllLocks = this.releaseAllLocks.bind(this);
    this.transferGuestLocks = this.transferGuestLocks.bind(this);
    this.getMyLocks = this.getMyLocks.bind(this);
  }

  /**
   * Lock seats for a user
   * POST /:tripId/seats/lock
   */
  async lockSeats(req, res) {
    try {
      const { id: tripId } = req.params;
      const { error, value } = this.lockSeatsSchema.validate(req.body);

      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      const isGuest = value.isGuest || !req.user;
      let userId;
      let sessionId = value.sessionId;

      if (isGuest) {
        // For guest users, generate a temporary user ID
        if (!sessionId) {
          // Generate a unique session ID for the guest
          sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        userId = `guest_${sessionId}`;
      } else {
        // Authenticated user
        userId = req.user.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
          });
        }
      }

      const result = await seatLockService.lockSeats(tripId, value.seatCodes, userId, sessionId);

      res.json({
        success: true,
        data: {
          ...result,
          sessionId: isGuest ? sessionId : undefined, // Return sessionId for guests
        },
        message: 'Seats locked successfully',
      });
    } catch (err) {
      console.error('SeatLockController.lockSeats: Error occurred:', err.message);

      if (err.message.includes('already locked')) {
        return res.status(409).json({
          success: false,
          error: { code: 'SEATS_LOCKED', message: err.message },
        });
      }

      if (err.message.includes('exceed maximum')) {
        return res.status(400).json({
          success: false,
          error: { code: 'MAX_SEATS_EXCEEDED', message: err.message },
        });
      }

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' },
      });
    }
  }

  /**
   * Extend locks for seats
   * POST /:tripId/seats/extend
   */
  async extendLocks(req, res) {
    try {
      const { id: tripId } = req.params;
      const { error, value } = this.extendLocksSchema.validate(req.body);

      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      const isGuest = value.isGuest || !req.user;
      let userId;
      let sessionId = value.sessionId;

      if (isGuest) {
        // For guest users, reconstruct userId from sessionId
        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: { code: 'VAL_002', message: 'sessionId is required for guest operations' },
          });
        }
        userId = `guest_${sessionId}`;
      } else {
        // Authenticated user
        userId = req.user.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
          });
        }
      }

      const result = await seatLockService.extendLocks(tripId, value.seatCodes, userId, sessionId);

      res.json({
        success: true,
        data: result,
        message: 'Seat locks extended successfully',
      });
    } catch (err) {
      console.error('SeatLockController.extendLocks: Error occurred:', err.message);

      if (err.message.includes('Cannot extend locks')) {
        return res.status(403).json({
          success: false,
          error: { code: 'LOCK_PERMISSION_DENIED', message: err.message },
        });
      }

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' },
      });
    }
  }

  /**
   * Release locks for seats
   * POST /:tripId/seats/release
   */
  async releaseLocks(req, res) {
    try {
      const { id: tripId } = req.params;
      const { error, value } = this.releaseLocksSchema.validate(req.body);

      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      const isGuest = value.isGuest || !req.user;
      let userId;
      let sessionId = value.sessionId;

      // Special handling for service calls (no auth headers) - allow releasing locks for cancelled bookings
      if (!req.user) {
        // Service call - allow releasing locks by seat codes without ownership validation
        console.log('🔓 Service call: releasing locks without ownership validation');
        const result = await seatLockService.releaseLocksBySeatCodes(tripId, value.seatCodes);
        return res.json({
          success: true,
          data: result,
          message: 'Seat locks released successfully (service call)',
        });
      }

      if (isGuest) {
        // For guest users, reconstruct userId from sessionId
        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: { code: 'VAL_002', message: 'sessionId is required for guest operations' },
          });
        }
        userId = `guest_${sessionId}`;
      } else {
        // Authenticated user
        userId = req.user.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
          });
        }
      }

      const result = await seatLockService.releaseLocks(tripId, value.seatCodes, userId, sessionId);

      res.json({
        success: true,
        data: result,
        message: 'Seat locks released successfully',
      });
    } catch (err) {
      console.error('SeatLockController.releaseLocks: Error occurred:', err.message);

      if (err.message.includes('Cannot release locks')) {
        return res.status(403).json({
          success: false,
          error: { code: 'LOCK_PERMISSION_DENIED', message: err.message },
        });
      }

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' },
      });
    }
  }

  /**
   * Release all locks for a user on a trip
   * POST /:tripId/seats/release-all
   */
  async releaseAllLocks(req, res) {
    try {
      const { id: tripId } = req.params;
      const { error, value } = this.releaseAllLocksSchema.validate(req.body);

      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: error.details[0].message },
        });
      }

      const isGuest = value.isGuest || !req.user;
      let userId;
      let sessionId = value.sessionId;

      if (isGuest) {
        // For guest users, reconstruct userId from sessionId
        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: { code: 'VAL_002', message: 'sessionId is required for guest operations' },
          });
        }
        userId = `guest_${sessionId}`;
      } else {
        // Authenticated user
        userId = req.user.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
          });
        }
      }

      const result = await seatLockService.releaseAllUserLocks(tripId, userId, sessionId);

      res.json({
        success: true,
        data: result,
        message: 'All seat locks released successfully',
      });
    } catch (err) {
      console.error('SeatLockController.releaseAllLocks: Error occurred:', err.message);

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' },
      });
    }
  }

  /**
   * Transfer guest locks to authenticated user
   * POST /:tripId/seats/transfer-guest-locks
   */
  async transferGuestLocks(req, res) {
    try {
      const { id: tripId } = req.params;
      const { guestSessionId, maxSeats = 5 } = req.body;

      if (!guestSessionId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_001', message: 'guestSessionId is required' },
        });
      }

      // Must be authenticated user
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }

      const authUserId = req.user.userId;
      const guestUserId = `guest_${guestSessionId}`;

      const result = await seatLockService.transferGuestLocksToUser(
        tripId,
        guestUserId,
        guestSessionId,
        authUserId,
        maxSeats
      );

      res.json({
        success: true,
        data: result,
        message: 'Guest locks transferred successfully',
      });
    } catch (err) {
      console.error('SeatLockController.transferGuestLocks: Error occurred:', err.message);

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' },
      });
    }
  }

  /**
   * Get user's locked seats for a trip
   * GET /:tripId/seats/my-locks
   */
  async getMyLocks(req, res) {
    try {
      const { id: tripId } = req.params;
      const { sessionId, isGuest } = req.query;

      const isGuestUser = isGuest === 'true' || !req.user;
      let userId;

      if (isGuestUser) {
        // For guest users, reconstruct userId from sessionId
        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: { code: 'VAL_002', message: 'sessionId is required for guest operations' },
          });
        }
        userId = `guest_${sessionId}`;
      } else {
        // Authenticated user
        userId = req.user.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
          });
        }
      }

      const lockedSeats = await seatLockService.getUserLockedSeats(userId, tripId);

      res.json({
        success: true,
        data: {
          trip_id: tripId,
          user_id: userId,
          locked_seats: lockedSeats,
        },
      });
    } catch (err) {
      console.error('SeatLockController.getMyLocks: Error occurred:', err.message);

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' },
      });
    }
  }
}

module.exports = new SeatLockController();
