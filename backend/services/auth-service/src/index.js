const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const authController = require('./authController');
const { authenticate } = require('./authMiddleware');

const app = express();
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
    version: '1.0.0'
  });
});

// Routes
app.post('/register', authController.register);
app.post('/login', authController.login);
app.post('/oauth/google', authController.googleAuth);
app.post('/refresh', authenticate, authController.refresh);
app.post('/logout', authenticate, authController.logout);
app.get('/verify-email', authController.verifyEmail);
app.post('/resend-verification', authController.resendVerificationEmail);
app.post('/forgot-password', authController.forgotPassword);
app.post('/reset-password', authController.resetPassword);

// Error handling
app.use((err, req, res, next) => {
  console.error('⚠️', err.stack);
  res.status(500).json({
    success: false,
    error: { code: 'SYS_001', message: 'Internal server error' },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Auth Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;