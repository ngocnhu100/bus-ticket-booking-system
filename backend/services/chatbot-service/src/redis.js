const redis = require('redis');

let redisClient;

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Client Connected');
    });

    await redisClient.connect();
  }

  return redisClient;
};

module.exports = { getRedisClient };
