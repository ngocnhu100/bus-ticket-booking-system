const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: process.env.REDIS_URL && process.env.NODE_ENV === 'production' ? { tls: true } : {},
});

redisClient.connect()
  .then(() => {
    console.log('🔌 Redis client connected');
  })
  .catch((err) => {
    console.error('⚠️ Redis connection failed:', err.message);
  });

redisClient.on('error', (err) => {
  console.error('⚠️ Redis error:', err.message);
});

module.exports = redisClient;
