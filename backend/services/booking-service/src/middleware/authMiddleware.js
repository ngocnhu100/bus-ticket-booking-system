const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * Middleware to authenticate requests using JWT
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'No token provided',
        },
      });
    }

    const token = authHeader.substring(7);

    try {
      // Verify token locally
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      console.log('[AuthMiddleware] Token verified successfully');
      console.log('[AuthMiddleware] Decoded payload:', JSON.stringify(decoded, null, 2));

      next();
    } catch (jwtError) {
      // If local verification fails, try auth service
      try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
        const response = await axios.post(
          `${authServiceUrl}/verify`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          req.user = response.data.data.user;
          next();
        } else {
          throw new Error('Token validation failed');
        }
      } catch (serviceError) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_002',
            message: 'Invalid or expired token',
          },
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Authentication error',
      },
    });
  }
}

/**
 * Middleware to authorize based on user roles
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Authentication required',
        },
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
}

/**
 * Optional authentication - attach user if token is valid, but don't fail if missing
 */
async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log('[OptionalAuth] Checking authorization header:', {
    hasHeader: !!authHeader,
    headerValue: authHeader ? authHeader.substring(0, 50) + '...' : 'none',
  });

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[OptionalAuth] No valid Bearer token found, treating as guest');
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);

  try {
    // Try local JWT verification first
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log('[OptionalAuth] ✅ Token verified locally');
    console.log('[OptionalAuth] User data:', JSON.stringify(decoded, null, 2));
    next();
  } catch (jwtError) {
    console.log('[OptionalAuth] ⚠️ Local JWT verification failed:', jwtError.message);
    // If local verification fails, try auth service
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
      console.log('[OptionalAuth] Attempting auth service verification at:', authServiceUrl);

      const response = await axios.post(
        `${authServiceUrl}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        req.user = response.data.data.user;
        console.log('[OptionalAuth] ✅ Token verified via auth service');
        console.log('[OptionalAuth] User:', JSON.stringify(req.user, null, 2));
        next();
      } else {
        // Token validation failed, treat as guest
        console.log('[OptionalAuth] ⚠️ Auth service rejected token, treating as guest');
        req.user = null;
        next();
      }
    } catch (serviceError) {
      // Auth service error, treat as guest
      console.log(
        '[OptionalAuth] ⚠️ Auth service error:',
        serviceError.message,
        '- treating as guest'
      );
      req.user = null;
      next();
    }
  }
}

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
};
