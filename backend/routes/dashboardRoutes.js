const express = require('express');
const router = express.Router();

// Mock data for dashboard (replace with real data later)
const mockDashboardData = {
  summary: {
    totalUsers: 1250,
    activeUsers: 890,
    totalBookings: 3450,
    revenue: 125000
  },
  activity: [
    { id: 1, action: 'User registered', timestamp: '2024-01-15T10:30:00Z' },
    { id: 2, action: 'Booking created', timestamp: '2024-01-15T09:45:00Z' },
    { id: 3, action: 'Payment processed', timestamp: '2024-01-15T09:15:00Z' }
  ],
  stats: {
    monthlyRevenue: 45000,
    bookingGrowth: 12.5,
    userGrowth: 8.3
  }
};

// Authentication middleware (simplified for now)
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_001', message: 'Authorization required' },
      timestamp: new Date().toISOString()
    });
  }
  // TODO: Verify JWT token
  req.user = { id: 1, role: 'passenger' }; // Mock user
  next();
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

// Protected routes - require authentication
router.get('/summary', authenticate, (req, res) => {
  res.json({
    success: true,
    data: mockDashboardData.summary,
    timestamp: new Date().toISOString()
  });
});

router.get('/activity', authenticate, (req, res) => {
  res.json({
    success: true,
    data: mockDashboardData.activity,
    timestamp: new Date().toISOString()
  });
});

router.get('/stats', authenticate, authorize(['admin']), (req, res) => {
  res.json({
    success: true,
    data: mockDashboardData.stats,
    timestamp: new Date().toISOString()
  });
});

// Admin-only route
router.get('/admin-data', authenticate, authorize(['admin']), (req, res) => {
  res.json({
    success: true,
    data: {
      systemHealth: 'Good',
      serverLoad: 45,
      databaseConnections: 12
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;