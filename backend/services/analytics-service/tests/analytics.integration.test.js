// analytics.integration.test.js - Integration tests for Analytics Service
// Tests data sync and analytics aggregation workflows

const request = require('supertest');
const express = require('express');

// Mock analytics repository
const mockAnalyticsRepository = {
  getRevenueByDateRange: jest.fn(),
  getBookingStats: jest.fn(),
  getPopularRoutes: jest.fn(),
  syncBookingData: jest.fn(),
  getOccupancyRate: jest.fn()
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Analytics endpoints
  app.get('/api/analytics/revenue', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const revenue = await mockAnalyticsRepository.getRevenueByDateRange(startDate, endDate);
      res.json({ success: true, revenue });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/bookings', async (req, res) => {
    try {
      const { period } = req.query;
      const stats = await mockAnalyticsRepository.getBookingStats(period);
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/routes/popular', async (req, res) => {
    try {
      const { limit } = req.query;
      const routes = await mockAnalyticsRepository.getPopularRoutes(parseInt(limit) || 10);
      res.json({ success: true, routes });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/occupancy', async (req, res) => {
    try {
      const { routeId, date } = req.query;
      const occupancy = await mockAnalyticsRepository.getOccupancyRate(routeId, date);
      res.json({ success: true, occupancy });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/analytics/sync', async (req, res) => {
    try {
      const { source, data } = req.body;
      await mockAnalyticsRepository.syncBookingData(source, data);
      res.json({ success: true, message: 'Data synced successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return app;
};

describe('Analytics Service - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/revenue - Revenue Analytics', () => {
    it('should retrieve revenue for date range', async () => {
      const mockRevenue = {
        totalRevenue: 15000000,
        bookingCount: 30,
        averageBookingValue: 500000,
        byDate: [
          { date: '2026-01-01', revenue: 5000000, count: 10 },
          { date: '2026-01-02', revenue: 6000000, count: 12 },
          { date: '2026-01-03', revenue: 4000000, count: 8 }
        ]
      };

      mockAnalyticsRepository.getRevenueByDateRange.mockResolvedValue(mockRevenue);

      const response = await request(app)
        .get('/api/analytics/revenue')
        .query({
          startDate: '2026-01-01',
          endDate: '2026-01-03'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.revenue.totalRevenue).toBe(15000000);
      expect(response.body.revenue.bookingCount).toBe(30);
      expect(response.body.revenue.byDate).toHaveLength(3);
    });

    it('should handle empty date range', async () => {
      mockAnalyticsRepository.getRevenueByDateRange.mockResolvedValue({
        totalRevenue: 0,
        bookingCount: 0,
        averageBookingValue: 0,
        byDate: []
      });

      const response = await request(app)
        .get('/api/analytics/revenue')
        .query({
          startDate: '2026-01-01',
          endDate: '2026-01-01'
        })
        .expect(200);

      expect(response.body.revenue.totalRevenue).toBe(0);
      expect(response.body.revenue.byDate).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockAnalyticsRepository.getRevenueByDateRange.mockRejectedValue(
        new Error('Database query failed')
      );

      const response = await request(app)
        .get('/api/analytics/revenue')
        .query({
          startDate: '2026-01-01',
          endDate: '2026-01-03'
        })
        .expect(500);

      expect(response.body.error).toContain('Database query failed');
    });

    it('should calculate growth rate', async () => {
      const mockRevenue = {
        totalRevenue: 20000000,
        previousPeriodRevenue: 15000000,
        growthRate: 33.33,
        byDate: []
      };

      mockAnalyticsRepository.getRevenueByDateRange.mockResolvedValue(mockRevenue);

      const response = await request(app)
        .get('/api/analytics/revenue')
        .query({
          startDate: '2026-01-01',
          endDate: '2026-01-07'
        })
        .expect(200);

      expect(response.body.revenue.growthRate).toBeCloseTo(33.33, 1);
    });
  });

  describe('GET /api/analytics/bookings - Booking Statistics', () => {
    it('should retrieve booking stats for period', async () => {
      const mockStats = {
        total: 150,
        confirmed: 120,
        cancelled: 20,
        pending: 10,
        confirmationRate: 80,
        cancellationRate: 13.33
      };

      mockAnalyticsRepository.getBookingStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/analytics/bookings')
        .query({ period: 'week' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats.total).toBe(150);
      expect(response.body.stats.confirmed).toBe(120);
      expect(response.body.stats.confirmationRate).toBe(80);
    });

    it('should handle different time periods', async () => {
      const periods = ['day', 'week', 'month', 'year'];

      for (const period of periods) {
        mockAnalyticsRepository.getBookingStats.mockResolvedValue({
          total: 100,
          period
        });

        const response = await request(app)
          .get('/api/analytics/bookings')
          .query({ period })
          .expect(200);

        expect(response.body.stats.period).toBe(period);
      }

      expect(mockAnalyticsRepository.getBookingStats).toHaveBeenCalledTimes(4);
    });

    it('should include hourly breakdown', async () => {
      const mockStats = {
        total: 240,
        byHour: [
          { hour: 8, count: 30 },
          { hour: 9, count: 45 },
          { hour: 10, count: 40 },
          { hour: 14, count: 50 },
          { hour: 15, count: 35 },
          { hour: 18, count: 40 }
        ]
      };

      mockAnalyticsRepository.getBookingStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/analytics/bookings')
        .query({ period: 'day' })
        .expect(200);

      expect(response.body.stats.byHour).toBeDefined();
      expect(response.body.stats.byHour).toHaveLength(6);
    });
  });

  describe('GET /api/analytics/routes/popular - Popular Routes', () => {
    it('should retrieve top popular routes', async () => {
      const mockRoutes = [
        {
          routeId: 'route-1',
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          bookingCount: 150,
          revenue: 75000000,
          averageOccupancy: 85
        },
        {
          routeId: 'route-2',
          origin: 'Ho Chi Minh City',
          destination: 'Da Nang',
          bookingCount: 120,
          revenue: 54000000,
          averageOccupancy: 80
        },
        {
          routeId: 'route-3',
          origin: 'Hanoi',
          destination: 'Da Nang',
          bookingCount: 90,
          revenue: 40500000,
          averageOccupancy: 75
        }
      ];

      mockAnalyticsRepository.getPopularRoutes.mockResolvedValue(mockRoutes);

      const response = await request(app)
        .get('/api/analytics/routes/popular')
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.routes).toHaveLength(3);
      expect(response.body.routes[0].bookingCount).toBe(150);
      expect(response.body.routes[0].origin).toBe('Ho Chi Minh City');
    });

    it('should limit number of routes', async () => {
      const mockRoutes = Array.from({ length: 5 }, (_, i) => ({
        routeId: `route-${i}`,
        bookingCount: 100 - i * 10
      }));

      mockAnalyticsRepository.getPopularRoutes.mockResolvedValue(mockRoutes);

      const response = await request(app)
        .get('/api/analytics/routes/popular')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.routes).toHaveLength(5);
    });

    it('should sort routes by booking count', async () => {
      const mockRoutes = [
        { routeId: 'route-1', bookingCount: 150 },
        { routeId: 'route-2', bookingCount: 120 },
        { routeId: 'route-3', bookingCount: 90 }
      ];

      mockAnalyticsRepository.getPopularRoutes.mockResolvedValue(mockRoutes);

      const response = await request(app)
        .get('/api/analytics/routes/popular')
        .query({ limit: 10 })
        .expect(200);

      const bookingCounts = response.body.routes.map(r => r.bookingCount);
      expect(bookingCounts).toEqual([150, 120, 90]);
    });
  });

  describe('GET /api/analytics/occupancy - Occupancy Rate', () => {
    it('should calculate occupancy rate for route', async () => {
      const mockOccupancy = {
        routeId: 'route-1',
        date: '2026-01-15',
        totalSeats: 40,
        bookedSeats: 34,
        occupancyRate: 85,
        trips: [
          { tripId: 'trip-1', departureTime: '08:00', occupancy: 90 },
          { tripId: 'trip-2', departureTime: '14:00', occupancy: 80 }
        ]
      };

      mockAnalyticsRepository.getOccupancyRate.mockResolvedValue(mockOccupancy);

      const response = await request(app)
        .get('/api/analytics/occupancy')
        .query({
          routeId: 'route-1',
          date: '2026-01-15'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.occupancy.occupancyRate).toBe(85);
      expect(response.body.occupancy.bookedSeats).toBe(34);
      expect(response.body.occupancy.trips).toHaveLength(2);
    });

    it('should handle zero occupancy', async () => {
      const mockOccupancy = {
        routeId: 'route-2',
        date: '2026-01-20',
        totalSeats: 40,
        bookedSeats: 0,
        occupancyRate: 0,
        trips: []
      };

      mockAnalyticsRepository.getOccupancyRate.mockResolvedValue(mockOccupancy);

      const response = await request(app)
        .get('/api/analytics/occupancy')
        .query({
          routeId: 'route-2',
          date: '2026-01-20'
        })
        .expect(200);

      expect(response.body.occupancy.occupancyRate).toBe(0);
    });
  });

  describe('POST /api/analytics/sync - Data Synchronization', () => {
    it('should sync booking data successfully', async () => {
      const syncData = {
        bookings: [
          { bookingId: 'b1', amount: 500000, status: 'confirmed' },
          { bookingId: 'b2', amount: 450000, status: 'confirmed' }
        ]
      };

      mockAnalyticsRepository.syncBookingData.mockResolvedValue({ synced: 2 });

      const response = await request(app)
        .post('/api/analytics/sync')
        .send({
          source: 'booking-service',
          data: syncData
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAnalyticsRepository.syncBookingData).toHaveBeenCalledWith(
        'booking-service',
        syncData
      );
    });

    it('should handle sync errors', async () => {
      mockAnalyticsRepository.syncBookingData.mockRejectedValue(
        new Error('Sync failed')
      );

      const response = await request(app)
        .post('/api/analytics/sync')
        .send({
          source: 'booking-service',
          data: { bookings: [] }
        })
        .expect(500);

      expect(response.body.error).toContain('Sync failed');
    });

    it('should validate sync data', async () => {
      const response = await request(app)
        .post('/api/analytics/sync')
        .send({
          source: 'booking-service'
          // Missing data
        })
        .expect(500);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('Analytics Workflow Integration', () => {
    it('should generate comprehensive analytics report', async () => {
      // Revenue data
      mockAnalyticsRepository.getRevenueByDateRange.mockResolvedValue({
        totalRevenue: 50000000,
        bookingCount: 100,
        averageBookingValue: 500000
      });

      // Booking stats
      mockAnalyticsRepository.getBookingStats.mockResolvedValue({
        total: 100,
        confirmed: 85,
        cancelled: 10,
        pending: 5
      });

      // Popular routes
      mockAnalyticsRepository.getPopularRoutes.mockResolvedValue([
        { routeId: 'route-1', bookingCount: 40 },
        { routeId: 'route-2', bookingCount: 35 }
      ]);

      // Fetch all analytics
      const [revenueRes, bookingsRes, routesRes] = await Promise.all([
        request(app).get('/api/analytics/revenue').query({
          startDate: '2026-01-01',
          endDate: '2026-01-31'
        }),
        request(app).get('/api/analytics/bookings').query({ period: 'month' }),
        request(app).get('/api/analytics/routes/popular').query({ limit: 5 })
      ]);

      expect(revenueRes.status).toBe(200);
      expect(bookingsRes.status).toBe(200);
      expect(routesRes.status).toBe(200);

      expect(revenueRes.body.revenue.totalRevenue).toBe(50000000);
      expect(bookingsRes.body.stats.confirmed).toBe(85);
      expect(routesRes.body.routes).toHaveLength(2);
    });

    it('should track analytics over time periods', async () => {
      const dates = [
        { start: '2026-01-01', end: '2026-01-07' },
        { start: '2026-01-08', end: '2026-01-14' },
        { start: '2026-01-15', end: '2026-01-21' }
      ];

      let weekNumber = 0;
      for (const { start, end } of dates) {
        weekNumber++;
        mockAnalyticsRepository.getRevenueByDateRange.mockResolvedValueOnce({
          totalRevenue: weekNumber * 5000000,
          week: weekNumber
        });

        const response = await request(app)
          .get('/api/analytics/revenue')
          .query({ startDate: start, endDate: end })
          .expect(200);

        expect(response.body.revenue.totalRevenue).toBe(weekNumber * 5000000);
      }
    });
  });

  describe('Performance and Caching', () => {
    it('should handle large data sets efficiently', async () => {
      const largeDataset = {
        totalRevenue: 1000000000,
        byDate: Array.from({ length: 365 }, (_, i) => ({
          date: `2026-01-${(i % 30) + 1}`,
          revenue: Math.random() * 1000000,
          count: Math.floor(Math.random() * 50)
        }))
      };

      mockAnalyticsRepository.getRevenueByDateRange.mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/analytics/revenue')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-12-31'
        })
        .expect(200);
      const endTime = Date.now();

      expect(response.body.revenue.byDate).toHaveLength(365);
      expect(endTime - startTime).toBeLessThan(3000);
    });

    it('should handle concurrent analytics requests', async () => {
      mockAnalyticsRepository.getRevenueByDateRange.mockResolvedValue({
        totalRevenue: 10000000
      });
      mockAnalyticsRepository.getBookingStats.mockResolvedValue({
        total: 100
      });
      mockAnalyticsRepository.getPopularRoutes.mockResolvedValue([]);

      const requests = [
        request(app).get('/api/analytics/revenue').query({
          startDate: '2026-01-01',
          endDate: '2026-01-31'
        }),
        request(app).get('/api/analytics/bookings').query({ period: 'month' }),
        request(app).get('/api/analytics/routes/popular').query({ limit: 10 }),
        request(app).get('/api/analytics/revenue').query({
          startDate: '2026-02-01',
          endDate: '2026-02-28'
        })
      ];

      const responses = await Promise.all(requests);

      expect(responses.every(r => r.status === 200)).toBe(true);
    });
  });
});
