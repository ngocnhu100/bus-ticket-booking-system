class DashboardController {
  async getSummary(req, res) {
    try {
      // Mock data - in real app, query DB
      const summary = {
        totalBookings: 25,
        upcomingTrips: 3,
        recentActivity: [
          {
            type: 'booking',
            description: 'Booked trip to Hanoi',
            timestamp: '2025-11-21T10:00:00Z',
          },
          { type: 'payment', description: 'Payment completed', timestamp: '2025-11-21T09:00:00Z' },
        ],
      };

      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getActivity(req, res) {
    try {
      // Mock data
      const activities = [
        {
          id: 1,
          type: 'booking',
          description: 'New booking for Trip #123',
          timestamp: '2025-11-21T10:00:00Z',
        },
        {
          id: 2,
          type: 'payment',
          description: 'Payment received for Booking #456',
          timestamp: '2025-11-21T09:30:00Z',
        },
        {
          id: 3,
          type: 'trip',
          description: 'Trip #789 departed',
          timestamp: '2025-11-21T08:00:00Z',
        },
      ];

      res.json({
        success: true,
        data: activities,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getStats(req, res) {
    try {
      // Mock data - role-based: admins see more details
      const isAdmin = req.user.role === 'admin';
      const stats = {
        totalUsers: 1250,
        totalRevenue: 12500000,
        totalBookings: 450,
        activeTrips: 12,
      };

      if (isAdmin) {
        stats.detailedMetrics = {
          cancellationRate: 5.2,
          averageBookingValue: 22000,
        };
      }

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getAdminData(req, res) {
    try {
      // Restricted to admin only
      const adminData = {
        systemHealth: 'good',
        pendingApprovals: 5,
        revenue: 50000000,
      };

      res.json({
        success: true,
        data: adminData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new DashboardController();
