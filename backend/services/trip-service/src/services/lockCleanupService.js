const { getRedisClient } = require('../redis');

class LockCleanupService {
  constructor() {
    this.redisClient = getRedisClient();
    this.cleanupInterval = null;
    this.isRunning = false;
  }

  /**
   * Start the cleanup service
   * @param {number} intervalMinutes - Cleanup interval in minutes (default: 5)
   */
  start(intervalMinutes = 5) {
    if (this.isRunning) {
      console.log('Lock cleanup service is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`Starting lock cleanup service - checking every ${intervalMinutes} minutes`);

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredLocks();
      } catch (error) {
        console.error('Error during lock cleanup:', error);
      }
    }, intervalMs);

    // Run initial cleanup
    this.cleanupExpiredLocks().catch(error => {
      console.error('Error during initial lock cleanup:', error);
    });
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.isRunning = false;
      console.log('Lock cleanup service stopped');
    }
  }

  /**
   * Clean up expired locks from Redis
   */
  async cleanupExpiredLocks() {
    try {
      const keys = await this.redisClient.keys('seat_lock:*');

      if (keys.length === 0) {
        return;
      }

      let cleanedCount = 0;

      // Use pipeline for better performance
      const pipeline = this.redisClient.pipeline();

      for (const key of keys) {
        // Check if key still exists and get TTL
        pipeline.ttl(key);
      }

      const ttls = await pipeline.exec();

      // Clean up expired keys (TTL <= 0)
      const expiredKeys = [];
      for (let i = 0; i < keys.length; i++) {
        const ttl = ttls[i][1];
        if (ttl <= 0) {
          expiredKeys.push(keys[i]);
        }
      }

      if (expiredKeys.length > 0) {
        await this.redisClient.del(expiredKeys);
        cleanedCount = expiredKeys.length;
        console.log(`Cleaned up ${cleanedCount} expired seat locks`);
      }

    } catch (error) {
      console.error('Error cleaning up expired locks:', error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics
   */
  async getStats() {
    try {
      const keys = await this.redisClient.keys('seat_lock:*');
      return {
        totalLocks: keys.length,
        isRunning: this.isRunning,
        cleanupInterval: this.cleanupInterval ? 'active' : 'inactive'
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return {
        totalLocks: 0,
        isRunning: this.isRunning,
        cleanupInterval: this.cleanupInterval ? 'active' : 'inactive',
        error: error.message
      };
    }
  }
}

module.exports = new LockCleanupService();