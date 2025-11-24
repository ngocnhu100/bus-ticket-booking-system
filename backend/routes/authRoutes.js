const express = require('express');
const router = express.Router();
const axios = require('axios');

// Proxy all auth requests to the auth service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Helper function to proxy requests
const proxyRequest = async (req, res, method, path) => {
  try {
    const url = `${AUTH_SERVICE_URL}${path}`;
    const config = {
      method,
      url,
      headers: {
        ...req.headers,
        // Remove host header to avoid conflicts
        host: new URL(AUTH_SERVICE_URL).host,
      },
      data: req.body,
      params: req.query,
    };

    // Remove content-length as it might be incorrect after body transformation
    delete config.headers['content-length'];

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      // Forward the error response from the auth service
      res.status(error.response.status).json(error.response.data);
    } else {
      // Handle network or other errors
      res.status(500).json({
        success: false,
        error: { code: 'GW_001', message: 'Auth service unavailable' },
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Public routes
router.post('/register', (req, res) => proxyRequest(req, res, 'POST', '/register'));
router.post('/login', (req, res) => proxyRequest(req, res, 'POST', '/login'));
router.post('/oauth/google', (req, res) => proxyRequest(req, res, 'POST', '/oauth/google'));
router.post('/refresh', (req, res) => proxyRequest(req, res, 'POST', '/refresh'));
router.get('/verify-email', (req, res) => proxyRequest(req, res, 'GET', '/verify-email'));
router.post('/resend-verification', (req, res) => proxyRequest(req, res, 'POST', '/resend-verification'));
router.post('/forgot-password', (req, res) => proxyRequest(req, res, 'POST', '/forgot-password'));
router.post('/reset-password', (req, res) => proxyRequest(req, res, 'POST', '/reset-password'));
router.post('/request-otp', (req, res) => proxyRequest(req, res, 'POST', '/request-otp'));
router.post('/verify-otp', (req, res) => proxyRequest(req, res, 'POST', '/verify-otp'));

// Protected routes
router.post('/logout', (req, res) => proxyRequest(req, res, 'POST', '/logout'));
router.post('/change-password', (req, res) => proxyRequest(req, res, 'POST', '/change-password'));

module.exports = router;