const axios = require('axios');

// Authentication middleware
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
    const authServiceUrl = process.env.AUTH_SERVICE_URL;
    if (!authServiceUrl) {
        console.error('⚠️ Auth service URL is not defined in environment variables');
        return res.status(500).json({
            success: false,
            error: { code: 'GATEWAY_001', message: 'Auth service unavailable' },
            timestamp: new Date().toISOString()
        });
    }
    const response = await axios.post(`${authServiceUrl}/verify`, { token }, {
      timeout: 5000, // 5 seconds timeout
    });

    if (response.data.success && response.data.data.valid) {
      req.user = response.data.data.user;
      next();
    } else {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_002', message: 'Token expired or invalid' },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('⚠️ Auth service verification error:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    } else {
      return res.status(500).json({
        success: false,
        error: { code: 'GATEWAY_001', message: 'Auth service unavailable' },
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Authorization middleware
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