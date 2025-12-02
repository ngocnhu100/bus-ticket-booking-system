const Redis = require('ioredis');
require('dotenv').config();

let redisClient = null;

/**
 * Get Redis client instance (singleton pattern)
 * @returns {Redis|null} Redis client instance or null if connection failed
 */
function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    };

    // Use REDIS_URL if available (for Docker/production)
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, {
        retryStrategy: redisConfig.retryStrategy,
        maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
      });
    } else {
      redisClient = new Redis(redisConfig);
    }

    redisClient.on('connect', () => {
      console.log('✅ Redis client connected');
    });

    redisClient.on('ready', () => {
      console.log('🚀 Redis client ready');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis client error:', err.message);
    });

    redisClient.on('close', () => {
      console.log('🔌 Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis client reconnecting...');
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Failed to create Redis client:', error.message);
    return null;
  }
}

/**
 * Close Redis connection gracefully
 */
async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis connection closed gracefully');
  }
}

/**
 * Check if Redis is available
 * @returns {Promise<boolean>}
 */
async function isRedisAvailable() {
  try {
    const client = getRedisClient();
    if (!client) return false;
    
    await client.ping();
    return true;
  } catch (error) {
    console.warn('⚠️ Redis not available:', error.message);
    return false;
  }
}

module.exports = {
  getRedisClient,
  closeRedisConnection,
  isRedisAvailable
};
