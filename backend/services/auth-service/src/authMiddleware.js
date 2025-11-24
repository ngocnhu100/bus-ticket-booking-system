const authService = require('./authService');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_001', message: 'Authorization header missing or invalid' },
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.substring(7);
  const decoded = authService.verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_002', message: 'Token expired or invalid' },
      timestamp: new Date().toISOString()
    });
  }

  // Check if token is blacklisted
  const isBlacklisted = await authService.isTokenBlacklisted(token);
  if (isBlacklisted) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_004', message: 'Token has been revoked' },
      timestamp: new Date().toISOString()
    });
  }

  req.user = decoded;
  next();
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'AUTH_003', message: 'Insufficient permissions' },
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };