const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authController = require('./authController');
const { authenticate } = require('./authMiddleware');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    service: 'auth-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/oauth/google', authController.googleAuth);
app.post('/api/auth/refresh', authenticate, authController.refresh);
app.post('/api/auth/logout', authenticate, authController.logout);
app.get('/api/auth/verify-email', authController.verifyEmail);
app.post('/api/auth/resend-verification', authController.resendVerificationEmail);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);
app.post('/api/auth/request-otp', authController.requestOTP);
app.post('/api/auth/verify-otp', authController.verifyOTP);
app.post('/api/auth/change-password', authenticate, authController.changePassword);

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

// For Vercel serverless functions
module.exports = app;