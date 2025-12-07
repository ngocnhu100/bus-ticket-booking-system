const jwt = require('jsonwebtoken');
const redisClient = require('./redis');

// Anti-bruteforce rate limiting for guest lookups
const rateLimitGuestLookup = async (req, res, next) => {
  const { bookingReference } = req.params;
  const { contactEmail, contactPhone } = req.query;
  
  // Skip rate limiting for authenticated users
  if (req.user) {
    return next();
  }
  
  // For guest lookups, check rate limit
  const identifier = contactEmail || contactPhone || req.ip;
  const key = `rate_limit:booking_lookup:${identifier}`;
  
  try {
    const attempts = await redisClient.incr(key);
    
    if (attempts === 1) {
      // First attempt, set expiry to 15 minutes
      await redisClient.expire(key, 900);
    }
    
    // Allow max 10 attempts per 15 minutes
    if (attempts > 10) {
      return res.status(429).json({
        success: false,
        error: { 
          code: 'RATE_LIMIT_001', 
          message: 'Too many lookup attempts. Please try again in 15 minutes.' 
        },
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  } catch (error) {
    console.error('⚠️ Rate limit check failed:', error);
    // If Redis fails, continue anyway (fail-open)
    next();
  }
};

// Optional authentication - allows both authenticated and guest users
const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided - continue as guest
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Invalid token - continue as guest
    req.user = null;
    next();
  }
};

// Required authentication - blocks unauthenticated requests
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_001', message: 'Authentication required' },
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_002', message: 'Invalid or expired token' },
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { 
  authenticate, 
  optionalAuthenticate, 
  rateLimitGuestLookup 
};
