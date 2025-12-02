const { getRedisClient, isRedisAvailable } = require('./redis');

/**
 * Generate cache key from request query parameters
 * @param {Object} query - Request query parameters
 * @returns {string} Cache key
 */
function generateCacheKey(query) {
  const {
    origin,
    destination,
    date,
    passengers,
    busType,
    departureTime,
    minPrice,
    maxPrice,
    operatorId,
    amenities,
    page,
    limit
  } = query;

  // Sort amenities and busType arrays for consistent keys
  const sortedAmenities = amenities ? 
    (Array.isArray(amenities) ? amenities.sort().join(',') : amenities) : '';
  const sortedBusType = busType ? 
    (Array.isArray(busType) ? busType.sort().join(',') : busType) : '';

  const keyParts = [
    'trip:search',
    origin || '',
    destination || '',
    date || '',
    passengers || '',
    sortedBusType,
    departureTime || '',
    minPrice || '',
    maxPrice || '',
    operatorId || '',
    sortedAmenities,
    page || '1',
    limit || '10'
  ];

  return keyParts.join(':');
}

/**
 * Cache middleware for trip search
 * @param {number} ttl - Time to live in seconds (default: 600 = 10 minutes)
 * @returns {Function} Express middleware
 */
function cacheMiddleware(ttl = null) {
  const cacheTTL = ttl || parseInt(process.env.CACHE_TTL) || 600;

  return async (req, res, next) => {
    // Skip cache in test environment
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    try {
      // Check if Redis is available
      const redisAvailable = await isRedisAvailable();
      if (!redisAvailable) {
        console.log('⚠️ Redis not available, skipping cache');
        return next();
      }

      const redis = getRedisClient();
      const cacheKey = generateCacheKey(req.query);

      // Try to get cached data
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        
        // Parse and return cached response
        const parsedData = JSON.parse(cachedData);
        return res.json(parsedData);
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function(data) {
        // Only cache successful responses
        if (data.success && res.statusCode === 200) {
          redis.setex(cacheKey, cacheTTL, JSON.stringify(data))
            .then(() => {
              console.log(`💾 Cached response for ${cacheTTL}s: ${cacheKey}`);
            })
            .catch((err) => {
              console.error('❌ Failed to cache response:', err.message);
            });
        }

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('❌ Cache middleware error:', error.message);
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Clear cache for specific patterns
 * @param {string} pattern - Redis key pattern (e.g., 'trip:search:*')
 * @returns {Promise<number>} Number of keys deleted
 */
async function clearCache(pattern = 'trip:search:*') {
  try {
    const redis = getRedisClient();
    if (!redis) return 0;

    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;

    const deleted = await redis.del(...keys);
    console.log(`🗑️ Cleared ${deleted} cache keys matching: ${pattern}`);
    return deleted;
  } catch (error) {
    console.error('❌ Failed to clear cache:', error.message);
    return 0;
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
async function getCacheStats() {
  try {
    const redis = getRedisClient();
    if (!redis) return null;

    const info = await redis.info('stats');
    const keyspace = await redis.info('keyspace');
    const keys = await redis.keys('trip:search:*');

    return {
      connected: true,
      totalKeys: keys.length,
      info: info,
      keyspace: keyspace
    };
  } catch (error) {
    console.error('❌ Failed to get cache stats:', error.message);
    return {
      connected: false,
      error: error.message
    };
  }
}

module.exports = {
  cacheMiddleware,
  generateCacheKey,
  clearCache,
  getCacheStats
};
