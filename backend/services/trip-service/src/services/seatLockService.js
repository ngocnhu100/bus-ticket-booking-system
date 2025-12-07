// services/seatLockService.js
const { getRedisClient } = require('../redis');

class SeatLockService {
  constructor() {
    this.redis = getRedisClient();
    this.LOCK_TTL = 10 * 60; // 10 minutes in seconds
    this.LOCK_PREFIX = 'seat_lock:';
  }

  /**
   * Generate lock key for a seat
   * @param {string} tripId - Trip ID
   * @param {string} seatCode - Seat code
   * @returns {string} Redis key
   */
  _getLockKey(tripId, seatCode) {
    return `${this.LOCK_PREFIX}${tripId}:${seatCode}`;
  }

  /**
   * Generate user lock set key
   * @param {string} userId - User ID
   * @param {string} tripId - Trip ID
   * @returns {string} Redis key
   */
  _getUserLockKey(userId, tripId) {
    return `user_locks:${userId}:${tripId}`;
  }

  /**
   * Lock seats for a user
   * @param {string} tripId - Trip ID
   * @param {string[]} seatCodes - Array of seat codes to lock
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID for additional validation
   * @returns {Promise<Object>} Lock result
   */
  async lockSeats(tripId, seatCodes, userId, sessionId) {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    const lockData = {
      userId,
      sessionId,
      lockedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.LOCK_TTL * 1000).toISOString()
    };

    const pipeline = this.redis.pipeline();
    const userLockKey = this._getUserLockKey(userId, tripId);

    // Check if any seats are already locked by other users
    for (const seatCode of seatCodes) {
      const lockKey = this._getLockKey(tripId, seatCode);
      pipeline.get(lockKey);
    }

    const results = await pipeline.exec();
    const lockedSeats = [];

    // Check for conflicts
    for (let i = 0; i < seatCodes.length; i++) {
      const existingLock = results[i][1]; // results[i][0] is error, [1] is value
      if (existingLock) {
        const lockInfo = JSON.parse(existingLock);
        if (lockInfo.userId !== userId) {
          lockedSeats.push(seatCodes[i]);
        }
      }
    }

    if (lockedSeats.length > 0) {
      throw new Error(`Seats already locked: ${lockedSeats.join(', ')}`);
    }

    // Lock all seats
    const lockPipeline = this.redis.pipeline();

    for (const seatCode of seatCodes) {
      const lockKey = this._getLockKey(tripId, seatCode);
      lockPipeline.setex(lockKey, this.LOCK_TTL, JSON.stringify(lockData));
      lockPipeline.sadd(userLockKey, seatCode);
    }

    // Set expiration for user lock set
    lockPipeline.expire(userLockKey, this.LOCK_TTL);

    await lockPipeline.exec();

    return {
      success: true,
      locked_seats: seatCodes,
      expires_at: lockData.expiresAt,
      ttl: this.LOCK_TTL
    };
  }

  /**
   * Extend lock for seats
   * @param {string} tripId - Trip ID
   * @param {string[]} seatCodes - Array of seat codes to extend
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID for validation
   * @returns {Promise<Object>} Extend result
   */
  async extendLocks(tripId, seatCodes, userId, sessionId) {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    const pipeline = this.redis.pipeline();
    const userLockKey = this._getUserLockKey(userId, tripId);

    // Verify user owns these locks
    for (const seatCode of seatCodes) {
      const lockKey = this._getLockKey(tripId, seatCode);
      pipeline.get(lockKey);
    }

    const results = await pipeline.exec();
    const invalidSeats = [];
    const validSeats = [];

    for (let i = 0; i < seatCodes.length; i++) {
      const seatCode = seatCodes[i];
      const existingLock = results[i][1];

      if (!existingLock) {
        invalidSeats.push(seatCode);
        continue;
      }

      const lockInfo = JSON.parse(existingLock);
      if (lockInfo.userId !== userId || lockInfo.sessionId !== sessionId) {
        invalidSeats.push(seatCode);
        continue;
      }

      validSeats.push(seatCode);
    }

    if (invalidSeats.length > 0) {
      throw new Error(`Cannot extend locks for seats: ${invalidSeats.join(', ')}`);
    }

    // Extend locks
    const extendData = {
      userId,
      sessionId,
      lockedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.LOCK_TTL * 1000).toISOString()
    };

    const extendPipeline = this.redis.pipeline();

    for (const seatCode of validSeats) {
      const lockKey = this._getLockKey(tripId, seatCode);
      extendPipeline.setex(lockKey, this.LOCK_TTL, JSON.stringify(extendData));
    }

    // Extend user lock set
    extendPipeline.expire(userLockKey, this.LOCK_TTL);

    await extendPipeline.exec();

    return {
      success: true,
      extended_seats: validSeats,
      expires_at: extendData.expiresAt,
      ttl: this.LOCK_TTL
    };
  }

  /**
   * Release locks for seats
   * @param {string} tripId - Trip ID
   * @param {string[]} seatCodes - Array of seat codes to release
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID for validation
   * @returns {Promise<Object>} Release result
   */
  async releaseLocks(tripId, seatCodes, userId, sessionId) {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    const pipeline = this.redis.pipeline();
    const userLockKey = this._getUserLockKey(userId, tripId);

    // Verify user owns these locks
    for (const seatCode of seatCodes) {
      const lockKey = this._getLockKey(tripId, seatCode);
      pipeline.get(lockKey);
    }

    const results = await pipeline.exec();
    const invalidSeats = [];
    const validSeats = [];

    for (let i = 0; i < seatCodes.length; i++) {
      const seatCode = seatCodes[i];
      const existingLock = results[i][1];

      if (!existingLock) {
        // Seat not locked, that's fine
        continue;
      }

      const lockInfo = JSON.parse(existingLock);
      if (lockInfo.userId !== userId || lockInfo.sessionId !== sessionId) {
        invalidSeats.push(seatCode);
        continue;
      }

      validSeats.push(seatCode);
    }

    if (invalidSeats.length > 0) {
      throw new Error(`Cannot release locks for seats: ${invalidSeats.join(', ')}`);
    }

    // Release locks
    const releasePipeline = this.redis.pipeline();

    for (const seatCode of validSeats) {
      const lockKey = this._getLockKey(tripId, seatCode);
      releasePipeline.del(lockKey);
      releasePipeline.srem(userLockKey, seatCode);
    }

    await releasePipeline.exec();

    return {
      success: true,
      released_seats: validSeats
    };
  }

  /**
   * Get user's locked seats for a trip
   * @param {string} userId - User ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<Array>} Array of locked seat objects
   */
  async getUserLockedSeats(userId, tripId) {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    const userLockKey = this._getUserLockKey(userId, tripId);
    const seatCodes = await this.redis.smembers(userLockKey);

    if (seatCodes.length === 0) {
      return [];
    }

    const pipeline = this.redis.pipeline();
    seatCodes.forEach(seatCode => {
      const lockKey = this._getLockKey(tripId, seatCode);
      pipeline.get(lockKey);
    });

    const results = await pipeline.exec();
    const lockedSeats = [];

    for (let i = 0; i < seatCodes.length; i++) {
      const seatCode = seatCodes[i];
      const lockData = results[i][1];

      if (lockData) {
        const lockInfo = JSON.parse(lockData);
        lockedSeats.push({
          seat_code: seatCode,
          locked_at: lockInfo.lockedAt,
          expires_at: lockInfo.expiresAt
        });
      }
    }

    return lockedSeats;
  }

  /**
   * Get all locked seats for a trip
   * @param {string} tripId - Trip ID
   * @returns {Promise<Object>} Locked seats data
   */
  async getLockedSeats(tripId) {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    const pattern = `${this.LOCK_PREFIX}${tripId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length === 0) {
      return {};
    }

    const pipeline = this.redis.pipeline();
    keys.forEach(key => pipeline.get(key));

    const results = await pipeline.exec();
    const lockedSeats = {};

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = results[i][1];

      if (value) {
        const seatCode = key.replace(`${this.LOCK_PREFIX}${tripId}:`, '');
        const lockInfo = JSON.parse(value);
        lockedSeats[seatCode] = {
          userId: lockInfo.userId,
          lockedAt: lockInfo.lockedAt,
          expiresAt: lockInfo.expiresAt
        };
      }
    }

    return lockedSeats;
  }

  /**
   * Get user's locked seats for a trip
   * @param {string} userId - User ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<Array>} Array of locked seat objects
   */
  async getUserLockedSeats(userId, tripId) {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    const userLockKey = this._getUserLockKey(userId, tripId);
    const seatCodes = await this.redis.smembers(userLockKey);

    if (seatCodes.length === 0) {
      return [];
    }

    const pipeline = this.redis.pipeline();
    seatCodes.forEach(seatCode => {
      const lockKey = this._getLockKey(tripId, seatCode);
      pipeline.get(lockKey);
    });

    const results = await pipeline.exec();
    const lockedSeats = [];

    for (let i = 0; i < seatCodes.length; i++) {
      const seatCode = seatCodes[i];
      const lockData = results[i][1];

      if (lockData) {
        const lockInfo = JSON.parse(lockData);
        lockedSeats.push({
          seat_code: seatCode,
          locked_at: lockInfo.lockedAt,
          expires_at: lockInfo.expiresAt
        });
      }
    }

    return lockedSeats;
  }

  /**
   * Clean up expired locks (should be called by a background job)
   * @returns {Promise<number>} Number of cleaned locks
   */
  async cleanupExpiredLocks() {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    // Redis automatically expires keys, but we can clean up user lock sets
    const pattern = 'user_locks:*';
    const keys = await this.redis.keys(pattern);

    let cleaned = 0;
    for (const key of keys) {
      const members = await this.redis.smembers(key);
      if (members.length === 0) {
        await this.redis.del(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Release all locks for a user on a trip
   * @param {string} userId - User ID
   * @param {string} tripId - Trip ID
   * @param {string} sessionId - Session ID for validation
   * @returns {Promise<Object>} Release result
   */
  async releaseAllUserLocks(userId, tripId, sessionId) {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    const userLockKey = this._getUserLockKey(userId, tripId);
    const seatCodes = await this.redis.smembers(userLockKey);

    if (seatCodes.length === 0) {
      return { success: true, releasedSeats: [] };
    }

    return await this.releaseLocks(tripId, seatCodes, userId, sessionId);
  }
}

module.exports = new SeatLockService();