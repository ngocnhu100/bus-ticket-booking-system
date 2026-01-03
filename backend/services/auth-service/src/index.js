const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// Always load .env file for development and Docker environments
require('dotenv').config();
const authService = require('./authService');
const authController = require('./authController');
const adminController = require('./controllers/adminController');
const { authenticate, authorize } = require('./authMiddleware');
const userRepository = require('./userRepository');

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'test' ? 3002 : 3001);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(authService.initialize());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'auth-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Routes
app.post('/register', authController.register);
app.post('/login', authController.login);
app.post('/oauth/google', authController.googleAuth);
app.post('/refresh', authController.refresh);
app.post('/verify', authController.verifyToken);
app.get('/verify-email', authController.verifyEmail);
app.post('/resend-verification', authController.resendVerificationEmail);
app.post('/forgot-password', authController.forgotPassword);
app.post('/reset-password', authController.resetPassword);
app.post('/request-otp', authController.requestOTP);
app.post('/verify-otp', authController.verifyOTP);
app.post('/logout', authenticate, authController.logout);
app.post('/change-password', authenticate, authController.changePassword);
app.get('/me', authenticate, async (req, res, next) => {
  try {
    await authController.getProfile(req, res);
  } catch (error) {
    next(error);
  }
});
app.put('/me', authenticate, async (req, res, next) => {
  try {
    await authController.updateProfile(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /auth/verify - Để verify token và lấy thông tin user
app.post('/auth/verify', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
      error: { code: 'VAL_001', message: 'Token is required' },
      timestamp: new Date().toISOString(),
    });
  }

  const decoded = authService.verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_002', message: 'Token expired or invalid' },
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    user: decoded,
  });
});

// POST /auth/blacklist-check - Để check token có bị blacklist không
app.post('/auth/blacklist-check', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
      error: { code: 'VAL_001', message: 'Token is required' },
      timestamp: new Date().toISOString(),
    });
  }

  const isBlacklisted = await authService.isTokenBlacklisted(token);
  res.json({ isBlacklisted });
});

// Middleware to validate internal service key
const validateInternalServiceKey = (req, res, next) => {
  const providedKey = req.headers['x-internal-key'];
  const expectedKey =
    process.env.INTERNAL_SERVICE_KEY || 'internal-service-secret-key-change-in-prod';

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Invalid or missing internal service key' },
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// GET /internal/profile/:userId - Internal endpoint (secured with shared key)
// Used by other services (e.g., booking-service for SMS preferences)
app.get('/internal/profile/:userId', validateInternalServiceKey, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_001', message: 'User ID is required' },
        timestamp: new Date().toISOString(),
      });
    }

    // Query user from database
    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        preferences: user.preferences || {},
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Internal Profile] Error:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'SYS_001', message: 'Internal server error' },
      timestamp: new Date().toISOString(),
    });
  }
});

// Admin Management Routes (Protected - Admin only)
// Admin health check (no auth required for monitoring)
app.get('/admin/health', (req, res) => {
  res.json({
    service: 'auth-service-admin',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.post('/admin/accounts', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await adminController.createAdmin(req, res);
  } catch (error) {
    next(error);
  }
});

app.get('/admin/accounts', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await adminController.getAllAdmins(req, res);
  } catch (error) {
    next(error);
  }
});

app.get('/admin/accounts/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await adminController.getAdminById(req, res);
  } catch (error) {
    next(error);
  }
});

app.put('/admin/accounts/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await adminController.updateAdmin(req, res);
  } catch (error) {
    next(error);
  }
});

app.post(
  '/admin/accounts/:id/deactivate',
  authenticate,
  authorize(['admin']),
  async (req, res, next) => {
    try {
      await adminController.deactivateAdmin(req, res);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  '/admin/accounts/:id/reactivate',
  authenticate,
  authorize(['admin']),
  async (req, res, next) => {
    try {
      await adminController.reactivateAdmin(req, res);
    } catch (error) {
      next(error);
    }
  }
);

app.get('/admin/stats', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await adminController.getAdminStats(req, res);
  } catch (error) {
    next(error);
  }
});

// User Management Routes (Protected - Admin only)
app.get('/admin/users', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await adminController.getAllUsers(req, res);
  } catch (error) {
    next(error);
  }
});

app.post(
  '/admin/users/:id/deactivate',
  authenticate,
  authorize(['admin']),
  async (req, res, next) => {
    try {
      await adminController.deactivateUser(req, res);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  '/admin/users/:id/reset-password',
  authenticate,
  authorize(['admin']),
  async (req, res, next) => {
    try {
      await adminController.resetUserPassword(req, res);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  '/admin/users/:id/reactivate',
  authenticate,
  authorize(['admin']),
  async (req, res, next) => {
    try {
      await adminController.reactivateUser(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Error handling
app.use((err, req, res, next) => {
  console.error('⚠️', err.stack);
  res.status(500).json({
    success: false,
    error: { code: 'SYS_001', message: 'Internal server error' },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Auth Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
