// services/seatLockService.js
const { getRedisClient } = require('../redis');

class SeatLockService {
  constructor() {
    this.redis = getRedisClient();
    this.LOCK_TTL = 10 * 60; // 10 minutes in seconds
    this.LOCK_PREFIX = 'seat_lock:';
    this.maxSeats = parseInt(process.env.MAX_SELECTABLE_SEATS) || 5;
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
      expiresAt: new Date(Date.now() + this.LOCK_TTL * 1000).toISOString(),
    };

    const pipeline = this.redis.pipeline();
    const userLockKey = this._getUserLockKey(userId, tripId);

    // Get current user locks and check which ones are still valid (not expired)
    const currentSeatCodes = await this.redis.smembers(userLockKey);
    let validLockCount = 0;
    const now = new Date().getTime();

    for (const seatCode of currentSeatCodes) {
      const lockKey = this._getLockKey(tripId, seatCode);
      const lockValue = await this.redis.get(lockKey);

      // Only count as valid if lock still exists (not expired)
      if (lockValue) {
        const lockInfo = JSON.parse(lockValue);
        const expiresAt = new Date(lockInfo.expiresAt).getTime();

        // If lock hasn't expired, count it
        if (expiresAt > now) {
          validLockCount++;
        } else {
          // Remove expired lock from user's lock set
          await this.redis.srem(userLockKey, seatCode);
        }
      } else {
        // Lock key doesn't exist but is in user lock set, remove it
        await this.redis.srem(userLockKey, seatCode);
      }
    }

    // Check if adding new seats would exceed limit (only count valid locks)
    if (validLockCount + seatCodes.length > this.maxSeats) {
      throw new Error(`Cannot lock seats: would exceed maximum ${this.maxSeats} seats per user`);
    }

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
      ttl: this.LOCK_TTL,
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
      expiresAt: new Date(Date.now() + this.LOCK_TTL * 1000).toISOString(),
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
      ttl: this.LOCK_TTL,
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
      released_seats: validSeats,
    };
  }

  /**
   * Release locks by seat codes without ownership validation (for service calls)
   * @param {string} tripId - Trip ID
   * @param {string[]} seatCodes - Array of seat codes to release
   * @returns {Promise<Object>} Release result
   */
  async releaseLocksBySeatCodes(tripId, seatCodes) {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    console.log(`🔓 [releaseLocksBySeatCodes] Attempting to release locks for seats: ${seatCodes.join(', ')} on trip: ${tripId}`);

    const pipeline = this.redis.pipeline();
    const releasedSeats = [];

    // Check which seats are actually locked
    for (const seatCode of seatCodes) {
      const lockKey = this._getLockKey(tripId, seatCode);
      pipeline.get(lockKey);
    }

    const results = await pipeline.exec();

    // Release locks for seats that are actually locked
    const releasePipeline = this.redis.pipeline();

    for (let i = 0; i < seatCodes.length; i++) {
      const seatCode = seatCodes[i];
      const lockKey = this._getLockKey(tripId, seatCode);
      const existingLock = results[i][1];

      console.log(`  Checking lock for ${seatCode}: ${existingLock ? 'EXISTS' : 'NOT_FOUND'}`);

      if (existingLock) {
        // Seat is locked, release it
        releasePipeline.del(lockKey);
        releasedSeats.push(seatCode);

        // Also remove from user lock set
        const lockInfo = JSON.parse(existingLock);
        const userLockKey = this._getUserLockKey(lockInfo.userId, tripId);
        console.log(`    Removing ${seatCode} from user lock set: ${userLockKey}`);
        releasePipeline.srem(userLockKey, seatCode);
      }
    }

    if (releasedSeats.length > 0) {
      console.log(`  Executing release for ${releasedSeats.length} seats: ${releasedSeats.join(', ')}`);
      await releasePipeline.exec();
      console.log(`✅ [releaseLocksBySeatCodes] Successfully released locks for: ${releasedSeats.join(', ')}`);
    } else {
      console.log(`⚠️ [releaseLocksBySeatCodes] No seats found to release`);
    }

    return {
      success: true,
      released_seats: releasedSeats,
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
    seatCodes.forEach((seatCode) => {
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
          expires_at: lockInfo.expiresAt,
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
    keys.forEach((key) => pipeline.get(key));

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
          expiresAt: lockInfo.expiresAt,
        };
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
   * Transfer guest locks to authenticated user
   * @param {string} tripId - Trip ID
   * @param {string} guestUserId - Guest user ID (guest_sessionId)
   * @param {string} guestSessionId - Guest session ID
   * @param {string} authUserId - Authenticated user ID
   * @param {number} maxSeats - Maximum seats allowed per user (default: 5)
   * @returns {Promise<Object>} Transfer result
   */
  async transferGuestLocksToUser(tripId, guestUserId, guestSessionId, authUserId, maxSeats = 5) {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    const guestLockKey = this._getUserLockKey(guestUserId, tripId);
    const authLockKey = this._getUserLockKey(authUserId, tripId);

    // Get guest locks and existing user locks
    const guestSeatCodes = await this.redis.smembers(guestLockKey);
    const existingUserSeats = await this.redis.smembers(authLockKey);

    if (guestSeatCodes.length === 0) {
      return { success: true, transferred_seats: [], rejected_seats: [] };
    }

    // Check if user already has locks
    const currentLockCount = existingUserSeats.length;
    const availableSlots = Math.max(0, maxSeats - currentLockCount);

    if (availableSlots === 0) {
      // User already has max seats locked, reject all transfers and release all guest locks
      const pipeline = this.redis.pipeline();

      // Get all guest lock details to release them
      for (const seatCode of guestSeatCodes) {
        const lockKey = this._getLockKey(tripId, seatCode);
        pipeline.get(lockKey);
      }

      const results = await pipeline.exec();

      // Release all guest locks since they're all rejected
      const releasePipeline = this.redis.pipeline();
      for (let i = 0; i < guestSeatCodes.length; i++) {
        const seatCode = guestSeatCodes[i];
        const existingLock = results[i][1];

        if (existingLock) {
          const lockInfo = JSON.parse(existingLock);
          // Only release if it's actually owned by this guest
          if (lockInfo.userId === guestUserId && lockInfo.sessionId === guestSessionId) {
            const lockKey = this._getLockKey(tripId, seatCode);
            releasePipeline.del(lockKey);
          }
        }
      }

      // Delete the guest lock set
      releasePipeline.del(guestLockKey);
      await releasePipeline.exec();

      return {
        success: true,
        transferred_seats: [],
        rejected_seats: guestSeatCodes,
        message: `Cannot transfer guest locks: user already has maximum ${maxSeats} seats locked`,
      };
    }

    /*     // Check if transferring all guest seats would exceed the limit
    if (guestSeatCodes.length > availableSlots) {
      // Reject entire transfer if it would exceed the limit
      return {
        success: true,
        transferredSeats: [],
        rejectedSeats: guestSeatCodes,
        message: `Cannot transfer ${guestSeatCodes.length} guest locks: would exceed maximum ${maxSeats} seats (user has ${currentLockCount}, can only add ${availableSlots} more)`
      };
    } */

    const pipeline = this.redis.pipeline();
    const transferredSeats = [];
    const rejectedSeats = [];

    // Check each seat lock and transfer if owned by guest
    for (const seatCode of guestSeatCodes) {
      const lockKey = this._getLockKey(tripId, seatCode);
      pipeline.get(lockKey);
    }

    const results = await pipeline.exec();

    // Transfer valid guest locks up to the limit
    const transferPipeline = this.redis.pipeline();

    for (let i = 0; i < guestSeatCodes.length; i++) {
      const seatCode = guestSeatCodes[i];
      const existingLock = results[i][1];

      if (existingLock) {
        const lockInfo = JSON.parse(existingLock);

        // Only transfer if it's actually owned by this guest
        if (lockInfo.userId === guestUserId && lockInfo.sessionId === guestSessionId) {
          // Check if we've hit the max seats limit
          if (transferredSeats.length >= availableSlots) {
            rejectedSeats.push(seatCode);
            // Release the rejected lock immediately
            const lockKey = this._getLockKey(tripId, seatCode);
            transferPipeline.del(lockKey);
            continue;
          }

          // Update lock data with authenticated user info
          const newLockData = {
            ...lockInfo,
            userId: authUserId,
            sessionId: authUserId, // Use auth user ID as session ID
            transferredAt: new Date().toISOString(),
          };

          // Update the lock
          const lockKey = this._getLockKey(tripId, seatCode);
          transferPipeline.setex(lockKey, this.LOCK_TTL, JSON.stringify(newLockData));

          // Move from guest lock set to auth user lock set
          transferPipeline.srem(guestLockKey, seatCode);
          transferPipeline.sadd(authLockKey, seatCode);
          transferPipeline.expire(authLockKey, this.LOCK_TTL);

          transferredSeats.push(seatCode);
        }
      }
    }

    // Clean up empty guest lock set
    transferPipeline.del(guestLockKey);

    await transferPipeline.exec();

    return {
      success: true,
      transferred_seats: transferredSeats,
      rejected_seats: rejectedSeats,
      message: `Transferred ${transferredSeats.length} guest locks to authenticated user${rejectedSeats.length > 0 ? ` (${rejectedSeats.length} rejected due to seat limit)` : ''}`,
    };
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
