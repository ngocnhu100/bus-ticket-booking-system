const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// Always load .env file for development and Docker environments
require('dotenv').config();
const authService = require('./authService');
const authController = require('./authController');
const { authenticate } = require('./authMiddleware');

const app = express();

// Avatar upload
const upload = require('./controllers/avatarMulter');
const uploadAvatar = require('./controllers/uploadAvatar.controller');
// Route: upload avatar (protected, follow doc)
app.put('/users/profile', authenticate, upload.single('avatar'), async (req, res, next) => {
  req.userRepository = require('./userRepository');
  try {
    await uploadAvatar(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /users/profile (follow doc)
app.get('/users/profile', authenticate, async (req, res, next) => {
  try {
    // Lấy user từ DB
    const userRepository = require('./userRepository');
    const user = await userRepository.findById(req.user.user_id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    // Chuẩn hóa response
    res.json({
      success: true,
      data: {
        userId: user.user_id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified,
        preferences: user.preferences,
        createdAt: user.created_at,
      }
    });
  } catch (error) {
    next(error);
  }
});
const PORT = process.env.PORT || (process.env.NODE_ENV === 'test' ? 3002 : 3001);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
