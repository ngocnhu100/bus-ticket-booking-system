// controllers/seatLockController.js
const seatLockService = require('../services/seatLockService');
const Joi = require('joi');

class SeatLockController {
  constructor() {
    // Validation schemas
    this.lockSeatsSchema = Joi.object({
      seatCodes: Joi.array().items(Joi.string().required()).min(1).max(10).required(),
      sessionId: Joi.string().optional()
    }).unknown(false);

    this.extendLocksSchema = Joi.object({
      seatCodes: Joi.array().items(Joi.string().required()).min(1).max(10).required(),
      sessionId: Joi.string().optional()
    }).unknown(false);

    this.releaseLocksSchema = Joi.object({
      seatCodes: Joi.array().items(Joi.string().required()).min(1).max(10).required(),
      sessionId: Joi.string().optional()
    }).unknown(false);

    this.releaseAllLocksSchema = Joi.object({
      sessionId: Joi.string().optional()
    }).unknown(false);

    // Bind methods to ensure correct 'this' context
    this.lockSeats = this.lockSeats.bind(this);
    this.extendLocks = this.extendLocks.bind(this);
    this.releaseLocks = this.releaseLocks.bind(this);
    this.releaseAllLocks = this.releaseAllLocks.bind(this);
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
          error: { code: 'VAL_001', message: error.details[0].message }
        });
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' }
        });
      }

      const result = await seatLockService.lockSeats(
        tripId,
        value.seatCodes,
        userId,
        value.sessionId || userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Seats locked successfully'
      });
    } catch (err) {
      console.error('SeatLockController.lockSeats: Error occurred:', err.message);

      if (err.message.includes('already locked')) {
        return res.status(409).json({
          success: false,
          error: { code: 'SEATS_LOCKED', message: err.message }
        });
      }

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' }
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
          error: { code: 'VAL_001', message: error.details[0].message }
        });
      }

      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' }
        });
      }

      const result = await seatLockService.extendLocks(
        tripId,
        value.seatCodes,
        userId,
        value.sessionId || userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Seat locks extended successfully'
      });
    } catch (err) {
      console.error('SeatLockController.extendLocks: Error occurred:', err.message);

      if (err.message.includes('Cannot extend locks')) {
        return res.status(403).json({
          success: false,
          error: { code: 'LOCK_PERMISSION_DENIED', message: err.message }
        });
      }

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' }
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
          error: { code: 'VAL_001', message: error.details[0].message }
        });
      }

      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' }
        });
      }

      const result = await seatLockService.releaseLocks(
        tripId,
        value.seatCodes,
        userId,
        value.sessionId || userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Seat locks released successfully'
      });
    } catch (err) {
      console.error('SeatLockController.releaseLocks: Error occurred:', err.message);

      if (err.message.includes('Cannot release locks')) {
        return res.status(403).json({
          success: false,
          error: { code: 'LOCK_PERMISSION_DENIED', message: err.message }
        });
      }

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' }
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
          error: { code: 'VAL_001', message: error.details[0].message }
        });
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' }
        });
      }

      const result = await seatLockService.releaseAllUserLocks(
        tripId,
        userId,
        value.sessionId || userId
      );

      res.json({
        success: true,
        data: result,
        message: 'All seat locks released successfully'
      });
    } catch (err) {
      console.error('SeatLockController.releaseAllLocks: Error occurred:', err.message);

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' }
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

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' }
        });
      }

      const lockedSeats = await seatLockService.getUserLockedSeats(userId, tripId);

      res.json({
        success: true,
        data: {
          trip_id: tripId,
          user_id: userId,
          locked_seats: lockedSeats
        }
      });
    } catch (err) {
      console.error('SeatLockController.getMyLocks: Error occurred:', err.message);

      res.status(500).json({
        success: false,
        error: { code: 'SYS_ERROR', message: 'Internal Server Error' }
      });
    }
  }
}

module.exports = new SeatLockController();