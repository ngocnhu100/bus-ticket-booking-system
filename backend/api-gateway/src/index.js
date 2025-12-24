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

    const response = await axios({
      method: req.method,
      url: `${tripServiceUrl}${req.path}${queryString}`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization, // ← Quan trọng: chuyển token sang trip-service
        'content-type': 'application/json',
      },
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
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          type: 'payment',
          description: 'Payment completed for booking #12345',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    };
    return res.json({
      success: true,
      data: summaryData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'payment',
        description: 'Payment completed for booking #12345',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 3,
        type: 'profile',
        description: 'Updated profile information',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ];
    return res.json({
      success: true,
      data: activityData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Dashboard activity error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString(),
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
      activeTrips: 45,
    };
    return res.json({
      success: true,
      data: statsData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString(),
    });
  }
});

app.get(
  '/dashboard/passenger-profile',
  authenticate,
  authorize(['passenger']),
  async (req, res) => {
    try {
      // Passenger-only profile data
      const profileData = {
        loyaltyPoints: 250,
        favoriteRoutes: ['Hanoi - Ho Chi Minh', 'Hanoi - Da Nang'],
        travelHistory: 12,
        nextTrip: {
          destination: 'Ho Chi Minh City',
          date: '2025-12-01',
          status: 'confirmed',
        },
      };
      return res.json({
        success: true,
        data: profileData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️ Dashboard passenger profile error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

app.get('/dashboard/upcoming-trips', authenticate, authorize(['passenger']), async (req, res) => {
  try {
    // Get user's upcoming trips
    const upcomingTrips = [
      {
        bookingId: 'BK2025HS001',
        from: 'HCM',
        to: 'Hanoi',
        date: '2025-11-15',
        time: '08:00',
        seats: ['A1', 'A2'],
        status: 'confirmed',
        price: 500000,
      },
      {
        bookingId: 'BK2025HH002',
        from: 'Hanoi',
        to: 'Hue',
        date: '2025-11-20',
        time: '14:00',
        seats: ['B3'],
        status: 'confirmed',
        price: 350000,
      },
    ];
    return res.json({
      success: true,
      data: upcomingTrips,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Dashboard upcoming trips error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/dashboard/trip-history', authenticate, authorize(['passenger']), async (req, res) => {
  try {
    // Get user's trip history
    const tripHistory = [
      {
        bookingId: 'BK2025HD003',
        from: 'Hanoi',
        to: 'Da Nang',
        date: '2025-10-10',
        time: '09:00',
        seats: ['C1', 'C2'],
        status: 'completed',
        price: 400000,
      },
      {
        bookingId: 'BK2025HN004',
        from: 'HCM',
        to: 'Nha Trang',
        date: '2025-09-05',
        time: '07:30',
        seats: ['D5'],
        status: 'completed',
        price: 300000,
      },
    ];
    return res.json({
      success: true,
      data: tripHistory,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Dashboard trip history error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/dashboard/payment-history', authenticate, authorize(['passenger']), async (req, res) => {
  try {
    // Get user's payment history
    const paymentHistory = [
      {
        paymentId: 'PAY001',
        bookingId: 'BK2025HS001',
        amount: 500000,
        currency: 'VND',
        date: '2025-11-01',
        status: 'completed',
        method: 'credit_card',
      },
      {
        paymentId: 'PAY002',
        bookingId: 'BK2025HH002',
        amount: 350000,
        currency: 'VND',
        date: '2025-10-15',
        status: 'completed',
        method: 'bank_transfer',
      },
    ];
    return res.json({
      success: true,
      data: paymentHistory,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Dashboard payment history error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/dashboard/notifications', authenticate, authorize(['passenger']), async (req, res) => {
  try {
    // Get user's notifications
    const notifications = [
      {
        id: 1,
        type: 'trip_reminder',
        title: 'Trip Reminder',
        message: 'Your trip to Hanoi is scheduled for tomorrow at 08:00',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        read: false,
      },
      {
        id: 2,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: 'Your booking BK2025HH002 has been confirmed',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        read: true,
      },
      {
        id: 3,
        type: 'new_route',
        title: 'New Route Available',
        message: 'Check out our new express route from HCM to Hanoi',
        timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        read: true,
      },
    ];
    return res.json({
      success: true,
      data: notifications,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Dashboard notifications error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/dashboard/admin/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // Admin dashboard statistics
    const statsData = {
      totalBookings: 1234,
      activeUsers: 856,
      revenueToday: 45200000,
      totalRevenue: 125000000,
      totalUsers: 2500,
      activeTrips: 45,
    };
    return res.json({
      success: true,
      data: statsData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Dashboard admin stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/dashboard/admin/bookings-trend', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // Bookings trend data for the last 7 days
    const bookingsTrend = [
      { day: 'Mon', bookings: 45, date: '2025-11-18' },
      { day: 'Tue', bookings: 52, date: '2025-11-19' },
      { day: 'Wed', bookings: 61, date: '2025-11-20' },
      { day: 'Thu', bookings: 55, date: '2025-11-21' },
      { day: 'Fri', bookings: 70, date: '2025-11-22' },
      { day: 'Sat', bookings: 85, date: '2025-11-23' },
      { day: 'Sun', bookings: 78, date: '2025-11-24' },
    ];
    return res.json({
      success: true,
      data: bookingsTrend,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Dashboard bookings trend error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/dashboard/admin/top-routes', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // Top performing routes
    const topRoutes = [
      { route: 'HCM → Hanoi', bookings: 234, revenue: 8200000 },
      { route: 'HCM → Dalat', bookings: 189, revenue: 3400000 },
      { route: 'Hanoi → Haiphong', bookings: 156, revenue: 2800000 },
      { route: 'Danang → Hue', bookings: 142, revenue: 2100000 },
    ];
    return res.json({
      success: true,
      data: topRoutes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Dashboard top routes error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
      timestamp: new Date().toISOString(),
    });
  }
});

app.get(
  '/dashboard/admin/recent-bookings',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      // Recent bookings for admin overview
      const recentBookings = [
        {
          id: 'BK-2045',
          customer: 'Nguyen Van A',
          route: 'HCM → Hanoi',
          date: '2025-11-21',
          amount: 450000,
          status: 'confirmed',
        },
        {
          id: 'BK-2044',
          customer: 'Tran Thi B',
          route: 'HCM → Dalat',
          date: '2025-11-21',
          amount: 280000,
          status: 'confirmed',
        },
        {
          id: 'BK-2043',
          customer: 'Le Van C',
          route: 'Hanoi → Haiphong',
          date: '2025-11-21',
          amount: 320000,
          status: 'pending',
        },
        {
          id: 'BK-2042',
          customer: 'Pham Thi D',
          route: 'Danang → Hue',
          date: '2025-11-20',
          amount: 250000,
          status: 'confirmed',
        },
        {
          id: 'BK-2041',
          customer: 'Hoang Van E',
          route: 'HCM → Hanoi',
          date: '2025-11-20',
          amount: 450000,
          status: 'confirmed',
        },
      ];
      return res.json({
        success: true,
        data: recentBookings,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️ Dashboard recent bookings error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'GATEWAY_003', message: 'Dashboard service error' },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

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