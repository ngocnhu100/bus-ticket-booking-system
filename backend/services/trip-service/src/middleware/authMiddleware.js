const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

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

  try {
    // Gọi auth-service để verify token
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/verify`, { token });

    if (!response.data.success) {
      return res.status(401).json(response.data);
    }

    // Kiểm tra blacklist
    const blacklistCheck = await axios.post(`${AUTH_SERVICE_URL}/auth/blacklist-check`, { token });
    if (blacklistCheck.data.isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_004', message: 'Token has been revoked' },
        timestamp: new Date().toISOString()
      });
    }

    req.user = response.data.user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_002', message: 'Token expired or invalid' },
      timestamp: new Date().toISOString()
    });
  }
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