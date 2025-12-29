const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const { authenticate, authorize } = require('./authMiddleware.js');
// Always load .env file for development and Docker environments
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Validate FRONTEND_URL in production
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('❌ FRONTEND_URL environment variable is required in production for CORS security');
  process.exit(1);
}

// Middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('combined'));

// For upload routes, skip JSON parsing and pass raw buffer
app.use('/trips/upload', express.raw({ type: 'multipart/form-data', limit: '50mb' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Auth service routes
app.use('/auth', async (req, res) => {
  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    const queryString = Object.keys(req.query).length
      ? '?' + new URLSearchParams(req.query).toString()
      : '';
    console.log(
      `🔄 Proxying ${req.method} ${req.originalUrl} to ${authServiceUrl}${req.path}${queryString}`
    );
    const response = await axios({
      method: req.method,
      url: `${authServiceUrl}${req.path}${queryString}`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
        'content-type': 'application/json',
      },
      timeout: 30000, // Increased timeout to 30 seconds
    });
    console.log(`✅ Auth service responded with status ${response.status}`);
    // Forward all headers from the response
    Object.keys(response.headers).forEach((key) => {
      res.set(key, response.headers[key]);
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Auth service error:`, error.message);
    if (error.response) {
      console.log(`❌ Auth service responded with error status ${error.response.status}`);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.log(`❌ Auth service unavailable or timeout`);
      res.status(500).json({
        success: false,
        error: { code: 'GATEWAY_001', message: 'Auth service unavailable' },
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Admin Management routes - proxy to auth-service
app.use('/admin', async (req, res) => {
  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    const queryString = Object.keys(req.query).length
      ? '?' + new URLSearchParams(req.query).toString()
      : '';
    console.log(
      `🔐 Proxying ${req.method} ${req.originalUrl} to ${authServiceUrl}/admin${req.path}${queryString}`
    );
    const response = await axios({
      method: req.method,
      url: `${authServiceUrl}/admin${req.path}${queryString}`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
        'content-type': 'application/json',
      },
      timeout: 30000,
    });
    console.log(`✅ Admin service responded with status ${response.status}`);
    // Forward all headers from the response
    Object.keys(response.headers).forEach((key) => {
      res.set(key, response.headers[key]);
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Admin service error:`, error.message);
    if (error.response) {
      console.log(`❌ Admin service responded with error status ${error.response.status}`);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.log(`❌ Admin service unavailable or timeout`);
      res.status(503).json({
        success: false,
        error: { code: 'GATEWAY_007', message: 'Admin service unavailable' },
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Notification service routes (if needed for direct access)
app.use('/notification', authenticate, async (req, res) => {
  try {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
    console.log(
      `🔄 Proxying ${req.method} ${req.originalUrl} to ${notificationServiceUrl}${req.path}`
    );
    const response = await axios({
      method: req.method,
      url: `${notificationServiceUrl}${req.path}`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
        'x-user-id': req.user?.userId,
        'content-type': req.headers['content-type'],
        accept: req.headers.accept,
        host: undefined,
      },
      timeout: 10000, // 10 seconds timeout
    });
    console.log(`✅ Notification service responded with status ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Notification service error:`, error.message);
    if (error.response) {
      console.log(`❌ Notification service responded with error status ${error.response.status}`);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.log(`❌ Notification service unavailable or timeout`);
      res.status(500).json({
        success: false,
        error: { code: 'GATEWAY_002', message: 'Notification service unavailable' },
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Booking service routes
// Ticket files proxy (static files - PDF downloads)
app.get('/bookings/tickets/:filename', async (req, res) => {
  try {
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:3004';
    const filename = req.params.filename;

    console.log(`📄 Proxying ticket download: /tickets/${filename}`);

    const response = await axios({
      method: 'GET',
      url: `${bookingServiceUrl}/tickets/${filename}`,
      responseType: 'stream', // Important for binary files
      timeout: 15000,
    });

    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe the response stream directly to client
    response.data.pipe(res);
  } catch (error) {
    console.error(`❌ Ticket download error:`, error.message);
    res.status(404).json({
      success: false,
      error: { code: 'TICKET_001', message: 'Ticket file not found' },
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/bookings', async (req, res) => {
  try {
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:3004';

    // req.path is already stripped of /bookings prefix by app.use
    // Just use req.path directly - NO need to add '/bookings' back
    const fullPath = req.path;

    // Query string is already in req.originalUrl, extract it properly
    const queryString = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';

    console.log(
      `🔄 Proxying ${req.method} ${req.originalUrl} to ${bookingServiceUrl}${fullPath}${queryString}`
    );

    const response = await axios({
      method: req.method,
      url: `${bookingServiceUrl}${fullPath}${queryString}`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
        'content-type': 'application/json',
      },
      timeout: 15000,
    });

    Object.keys(response.headers).forEach((key) => {
      if (key !== 'transfer-encoding') res.setHeader(key, response.headers[key]);
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Booking service error:`, error.message);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(503).json({
        success: false,
        error: { code: 'GATEWAY_004', message: 'Booking service unavailable' },
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Trip service routes
app.use('/trips', async (req, res) => {
  try {
    const tripServiceUrl = process.env.TRIP_SERVICE_URL || 'http://trip-service:3002';
    const queryString = Object.keys(req.query).length
      ? '?' + new URLSearchParams(req.query).toString()
      : '';

    console.log(
      `Proxying ${req.method} ${req.originalUrl} → ${tripServiceUrl}${req.path}${queryString}`
    );

    // Build headers - preserve original content-type for file uploads
    const headers = {
      authorization: req.headers.authorization, // ← Quan trọng: chuyển token sang trip-service
    };

    // Log upload requests for debugging
    if (req.path.includes('/upload')) {
      console.log('[API-Gateway Upload] Content-Type:', req.headers['content-type']);
      console.log(
        '[API-Gateway Upload] Body type:',
        typeof req.body,
        Buffer.isBuffer(req.body) ? `(${req.body.length} bytes)` : ''
      );
    }

    // Only set content-type if it's not a multipart upload
    if (
      req.headers['content-type'] &&
      req.headers['content-type'].includes('multipart/form-data')
    ) {
      headers['content-type'] = req.headers['content-type'];
      console.log('[API-Gateway Upload] Passing multipart header:', headers['content-type']);
    } else if (!req.body || Object.keys(req.body).length === 0) {
      // No body, don't set content-type
    } else {
      // Default JSON for other requests
      headers['content-type'] = 'application/json';
    }

    const response = await axios({
      method: req.method,
      url: `${tripServiceUrl}${req.path}${queryString}`,
      data: req.body,
      headers: headers,
      timeout: 15000,
    });

    // Forward headers (nếu cần)
    Object.keys(response.headers).forEach((key) => {
      if (key !== 'transfer-encoding') res.setHeader(key, response.headers[key]);
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Trip service error:`, error.message);

    if (error.response) {
      // Lỗi do trip-service trả về (401, 404, 500, v.v.)
      res.status(error.response.status).json(error.response.data);
    } else {
      // Trip service down hoặc timeout
      res.status(503).json({
        success: false,
        error: { code: 'GATEWAY_003', message: 'Trip service currently unavailable' },
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Analytics service routes (Admin only)
app.use('/analytics', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const analyticsServiceUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006';
    const queryString = Object.keys(req.query).length
      ? '?' + new URLSearchParams(req.query).toString()
      : '';

    console.log(
      `🔄 Proxying ${req.method} ${req.originalUrl} to ${analyticsServiceUrl}${req.path}${queryString}`
    );

    const response = await axios({
      method: req.method,
      url: `${analyticsServiceUrl}${req.path}${queryString}`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
        'x-user-id': req.user?.userId,
        'x-user-role': req.user?.role,
        'content-type': 'application/json',
      },
      timeout: 30000, // Analytics queries may take longer
    });

    console.log(`✅ Analytics service responded with status ${response.status}`);

    // Forward response headers
    Object.keys(response.headers).forEach((key) => {
      if (key !== 'transfer-encoding') res.setHeader(key, response.headers[key]);
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Analytics service error:`, error.message);

    if (error.response) {
      console.log(`❌ Analytics service responded with error status ${error.response.status}`);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.log(`❌ Analytics service unavailable or timeout`);
      res.status(503).json({
        success: false,
        error: { code: 'GATEWAY_005', message: 'Analytics service unavailable' },
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Payment service routes
app.use('/payment', async (req, res) => {
  try {
    const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';
    const queryString = Object.keys(req.query).length
      ? '?' + new URLSearchParams(req.query).toString()
      : '';
    console.log(
      `💳 Proxying ${req.method} ${req.originalUrl} to ${paymentServiceUrl}/api/payment${req.path}${queryString}`
    );
    const response = await axios({
      method: req.method,
      url: `${paymentServiceUrl}/api/payment${req.path}${queryString}`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
        'content-type': 'application/json',
      },
      timeout: 30000,
    });
    console.log(`✅ Payment service responded with status ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Payment service error:`, error.message);
    if (error.response) {
      console.log(`❌ Payment service responded with error status ${error.response.status}`);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.log(`❌ Payment service unavailable or timeout`);
      res.status(500).json({
        success: false,
        error: { code: 'GATEWAY_006', message: 'Payment service unavailable' },
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Chatbot service routes (Supports both guest and authenticated users)
app.use('/chatbot', async (req, res) => {
  try {
    const chatbotServiceUrl = process.env.CHATBOT_SERVICE_URL || 'http://localhost:3007';
    const queryString = Object.keys(req.query).length
      ? '?' + new URLSearchParams(req.query).toString()
      : '';

    console.log(
      `🤖 Proxying ${req.method} ${req.originalUrl} to ${chatbotServiceUrl}${req.path}${queryString}`
    );

    const response = await axios({
      method: req.method,
      url: `${chatbotServiceUrl}${req.path}${queryString}`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization, // Optional - supports both guest and authenticated
        'content-type': 'application/json',
      },
      timeout: 30000, // AI responses may take longer
    });

    console.log(`✅ Chatbot service responded with status ${response.status}`);

    // Forward response headers
    Object.keys(response.headers).forEach((key) => {
      if (key !== 'transfer-encoding') res.setHeader(key, response.headers[key]);
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Chatbot service error:`, error.message);

    if (error.response) {
      console.log(`❌ Chatbot service responded with error status ${error.response.status}`);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.log(`❌ Chatbot service unavailable or timeout`);
      res.status(503).json({
        success: false,
        error: { code: 'GATEWAY_006', message: 'Chatbot service unavailable' },
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Error handling - only handle actual errors
app.use((err, req, res, next) => {
  if (!err || typeof err !== 'object' || (!err.message && !err.stack)) return next();
  console.error('⚠️', err.stack || err);
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
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Auth Service: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`);
    console.log(`� Trip Service: ${process.env.TRIP_SERVICE_URL || 'http://localhost:3002'}`);
    console.log(
      `📧 Notification Service: ${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003'}`
    );
    console.log(
      `📦 Booking Service: ${process.env.BOOKING_SERVICE_URL || 'http://localhost:3004'}`
    );
    console.log(
      `📊 Analytics Service: ${process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006'}`
    );
    console.log(
      `🤖 Chatbot Service: ${process.env.CHATBOT_SERVICE_URL || 'http://localhost:3007'}`
    );
  });
}

module.exports = app;
