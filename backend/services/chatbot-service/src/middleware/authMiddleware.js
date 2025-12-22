const jwt = require('jsonwebtoken');

/**
 * Middleware to optionally authenticate requests
 * If token is provided and valid, attaches user to req.user
 * If token is invalid or missing, continues without authentication
 */
const optionalAuthenticate = (req, res, next) => {
  try {
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
      console.log('[optionalAuthenticate] Authenticated user:', decoded);
    } catch (err) {
      console.log('[optionalAuthenticate] Invalid token, continuing as guest');
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('[optionalAuthenticate] Error:', error);
    req.user = null;
    next();
  }
};

/**
 * Middleware to require authentication
 * Returns 401 if no valid token is provided
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_002',
        message: 'Invalid or expired token',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Middleware to check user roles
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: 'Insufficient permissions',
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
};
