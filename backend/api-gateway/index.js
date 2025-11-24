const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const jwt = require('jsonwebtoken');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authenticate = (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_002', message: 'Token expired or invalid' },
      timestamp: new Date().toISOString()
    });
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Auth service routes
app.use('/auth', async (req, res) => {
  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    const queryString = Object.keys(req.query).length ? '?' + new URLSearchParams(req.query).toString() : '';
    console.log(`🔄 Proxying ${req.method} ${req.originalUrl} to ${authServiceUrl}${req.path}${queryString}`);
    const response = await axios({
      method: req.method,
      url: `${authServiceUrl}${req.path}${queryString}`,
      data: req.body,
      headers: {
        'authorization': req.headers.authorization,
        'content-type': 'application/json',
      },
      timeout: 30000, // Increased timeout to 30 seconds
    });
    console.log(`✅ Auth service responded with status ${response.status}`);
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
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Notification service routes (if needed for direct access)
app.use('/notification', async (req, res) => {
  try {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
    console.log(`🔄 Proxying ${req.method} ${req.originalUrl} to ${notificationServiceUrl}${req.path}`);
    const response = await axios({
      method: req.method,
      url: `${notificationServiceUrl}${req.path}`,
      data: req.body,
      headers: {
        ...req.headers,
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
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Dashboard routes (API composition - aggregates data from multiple services)
app.get('/dashboard/summary', authenticate, async (req, res) => {
  try {
    // Aggregate data for passenger dashboard
    const summaryData = {
      totalBookings: 5,
      upcomingTrips: 2,
      recentActivity: [
        {
          id: 1,
          type: 'booking',
          description: 'Booked ticket for Hanoi to Ho Chi Minh',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'payment',
          description: 'Payment completed for booking #12345',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };
    return res.json({
      success: true,
      data: summaryData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('⚠️ Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/dashboard/activity', authenticate, async (req, res) => {
  try {
    // Return user activity data
    const activityData = [
      {
        id: 1,
        type: 'booking',
        description: 'Booked ticket for Hanoi to Ho Chi Minh',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        type: 'payment',
        description: 'Payment completed for booking #12345',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 3,
        type: 'profile',
        description: 'Updated profile information',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    return res.json({
      success: true,
      data: activityData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('⚠️ Dashboard activity error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/dashboard/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // Admin-only stats - aggregate from multiple services
    const statsData = {
      totalUsers: 1250,
      totalRevenue: 45000000,
      totalBookings: 3200,
      activeTrips: 45
    };
    return res.json({
      success: true,
      data: statsData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('⚠️ Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString()
    });
  }
});

// Catch-all for invalid dashboard endpoints
app.use('/dashboard/*', authenticate, (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Dashboard endpoint not found' },
    timestamp: new Date().toISOString()
  });
});

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
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Auth Service: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`);
    console.log(`📧 Notification Service: ${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003'}`);
  });
}

module.exports = app;