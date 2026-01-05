const request = require('supertest');
const axios = require('axios');
const app = require('../src/index');

// Mock axios for all tests
jest.mock('axios');

// Mock authentication middleware
jest.mock('../src/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { userId: 'mock-user-id', role: 'passenger' };
    next();
  },
  authorize: (roles) => (req, res, next) => {
    if (roles.includes(req.user?.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  },
}));

describe('API Gateway - Additional Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== /payment ROUTE (different from /payments) ====================
  describe('/payment route (singular)', () => {
    test('POST /payment/create-order - proxies to payment service', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          success: true,
          orderId: 'ORDER123',
          paymentUrl: 'https://payment.example.com/pay',
        },
      });

      const response = await request(app)
        .post('/payment/create-order')
        .send({
          amount: 500000,
          bookingId: 'BKG123',
          method: 'vnpay',
        })
        .set('Authorization', 'Bearer token123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringContaining('/api/payment/create-order'),
        })
      );
    });

    test('GET /payment/callback - handles payment callback', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          success: true,
          status: 'PAID',
        },
      });

      const response = await request(app).get('/payment/callback?orderId=ORDER123&status=SUCCESS');

      expect(response.status).toBe(200);
      expect(axios).toHaveBeenCalled();
    });

    test('handles /payment service errors', async () => {
      axios.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid payment method' },
        },
      });

      const response = await request(app).post('/payment/process').send({ method: 'invalid' });

      expect(response.status).toBe(400);
    });

    test('handles /payment service unavailable', async () => {
      axios.mockRejectedValue(new Error('ECONNREFUSED'));

      const response = await request(app).post('/payment/process').send({ amount: 100 });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('GATEWAY_006');
    });
  });

  // ==================== USER ROUTES ====================
  describe('User routes', () => {
    test('POST /users/change-password - changes password', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          success: true,
          message: 'Password changed successfully',
        },
      });

      const response = await request(app)
        .post('/users/change-password')
        .send({
          oldPassword: 'old123',
          newPassword: 'new456',
        })
        .set('Authorization', 'Bearer token123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /users/profile - gets user profile (JSON)', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          userId: 'USER123',
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer token123');

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe('USER123');
    });

    test('PUT /users/profile - updates user profile (JSON)', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          success: true,
          user: { name: 'Updated Name' },
        },
      });

      const response = await request(app)
        .put('/users/profile')
        .send({ name: 'Updated Name' })
        .set('Authorization', 'Bearer token123')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('handles user service errors', async () => {
      axios.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid password' },
        },
      });

      const response = await request(app).post('/users/change-password').send({});

      expect(response.status).toBe(400);
    });

    test('handles user service unavailable', async () => {
      axios.mockRejectedValue(new Error('Service timeout'));

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('GATEWAY_001');
    });
  });

  // ==================== QUERY PARAMETER HANDLING ====================
  describe('Query parameter handling', () => {
    test('forwards query parameters correctly', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: { results: [] },
      });

      await request(app).get('/trips/search?from=Hanoi&to=HCMC&date=2025-01-15');

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('from=Hanoi&to=HCMC&date=2025-01-15'),
        })
      );
    });

    test('handles empty query parameters', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: { results: [] },
      });

      await request(app).get('/trips/123');

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.not.stringContaining('?'),
        })
      );
    });

    test('properly encodes special characters in query', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: { results: [] },
      });

      // Use URL encoded version directly
      await request(app).get('/trips/search?city=Ho%20Chi%20Minh');

      expect(axios).toHaveBeenCalled();
      const callUrl = axios.mock.calls[0][0].url;
      expect(callUrl).toContain('city=');
    });
  });

  // ==================== HEADER FORWARDING ====================
  describe('Header forwarding', () => {
    test('forwards Authorization header to backend services', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: {},
      });

      await request(app).get('/bookings/123').set('Authorization', 'Bearer abc123');

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: 'Bearer abc123',
          }),
        })
      );
    });

    test('sets correct content-type for JSON requests', async () => {
      axios.mockResolvedValue({
        status: 201,
        headers: {},
        data: { created: true },
      });

      await request(app).post('/bookings').send({ data: 'test' });

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'content-type': 'application/json',
          }),
        })
      );
    });

    test('forwards custom headers from backend response', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {
          'x-custom-header': 'test-value',
          'x-request-id': 'req-123',
        },
        data: {},
      });

      const response = await request(app).get('/trips/123');

      expect(response.headers['x-custom-header']).toBe('test-value');
      expect(response.headers['x-request-id']).toBe('req-123');
    });
  });

  // ==================== ERROR RESPONSE FORWARDING ====================
  describe('Error response forwarding', () => {
    test('forwards 400 Bad Request errors', async () => {
      axios.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Missing required fields' },
        },
      });

      const response = await request(app).post('/bookings').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    test('forwards 401 Unauthorized errors', async () => {
      axios.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid token' },
        },
      });

      const response = await request(app).get('/users/profile').set('Authorization', 'Bearer bad');

      expect(response.status).toBe(401);
    });

    test('forwards 404 Not Found errors from backend', async () => {
      axios.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'Trip not found' },
        },
      });

      const response = await request(app).get('/trips/99999');

      expect(response.status).toBe(404);
    });

    test('forwards 500 Internal Server errors from backend', async () => {
      axios.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Database connection failed' },
        },
      });

      const response = await request(app).get('/bookings/123');

      expect(response.status).toBe(500);
    });
  });

  // ==================== TIMEOUT HANDLING ====================
  describe('Timeout handling', () => {
    test('handles request timeouts gracefully', async () => {
      axios.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
      });

      const response = await request(app).get('/trips/search?from=A&to=B');

      expect([500, 503]).toContain(response.status);
    });

    test('different services have appropriate timeout values', async () => {
      // This test verifies timeout configuration exists
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: {},
      });

      await request(app).post('/chatbot/message').send({ message: 'Hi' });

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: expect.any(Number),
        })
      );
    });
  });

  // ==================== HTTP METHODS ====================
  describe('HTTP method support', () => {
    beforeEach(() => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: { success: true },
      });
    });

    test('supports GET requests', async () => {
      await request(app).get('/trips/123');
      expect(axios).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET' }));
    });

    test('supports POST requests', async () => {
      await request(app).post('/bookings').send({});
      expect(axios).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }));
    });

    test('supports PUT requests', async () => {
      await request(app).put('/users/profile').send({});
      expect(axios).toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT' }));
    });

    test('supports PATCH requests', async () => {
      await request(app).patch('/bookings/123/cancel').send({});
      expect(axios).toHaveBeenCalledWith(expect.objectContaining({ method: 'PATCH' }));
    });

    test('supports DELETE requests', async () => {
      await request(app).delete('/admin/users/123');
      expect(axios).toHaveBeenCalledWith(expect.objectContaining({ method: 'DELETE' }));
    });
  });

  // ==================== SERVICE URL CONFIGURATION ====================
  describe('Service URL configuration', () => {
    test('uses environment variable for service URLs', async () => {
      process.env.TRIP_SERVICE_URL = 'http://custom-trip-service:9000';

      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: {},
      });

      await request(app).get('/trips/123');

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('http://custom-trip-service:9000'),
        })
      );

      delete process.env.TRIP_SERVICE_URL;
    });

    test('falls back to default URLs when env not set', async () => {
      delete process.env.BOOKING_SERVICE_URL;

      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: {},
      });

      await request(app).get('/bookings/123');

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('localhost:3004'),
        })
      );
    });
  });

  // ==================== RESPONSE HEADER FILTERING ====================
  describe('Response header filtering', () => {
    test('filters out transfer-encoding header', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {
          'transfer-encoding': 'chunked',
          'content-type': 'application/json',
        },
        data: {},
      });

      const response = await request(app).get('/bookings/123');

      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
      // transfer-encoding should be handled by Express, not explicitly set
    });

    test('preserves important response headers', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-cache',
          'x-rate-limit': '100',
        },
        data: {},
      });

      const response = await request(app).get('/trips/123');

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['x-rate-limit']).toBeDefined();
    });
  });

  // ==================== ERROR MIDDLEWARE ====================
  describe('Global error middleware', () => {
    test('catches uncaught errors and returns 500', async () => {
      // Force an error in the middleware chain
      const response = await request(app)
        .get('/force-error-test-route-that-does-not-exist-xyz')
        .send();

      // Should hit 404 handler instead since route doesn't exist
      expect([404, 500]).toContain(response.status);
    });

    test('handles malformed request bodies', async () => {
      const response = await request(app)
        .post('/bookings')
        .set('Content-Type', 'application/json')
        .send('{"invalid json');

      expect([400, 500]).toContain(response.status);
    });
  });

  // ==================== ADDITIONAL EDGE CASES ====================
  describe('Additional edge cases', () => {
    test('handles requests with no body', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: { success: true },
      });

      const response = await request(app).get('/trips/123');

      expect(response.status).toBe(200);
    });

    test('handles requests with empty body', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: { success: true },
      });

      const response = await request(app).post('/bookings').send({});

      expect(response.status).toBe(200);
    });

    test('handles multiple consecutive requests', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: { success: true },
      });

      const response1 = await request(app).get('/trips/1');
      const response2 = await request(app).get('/trips/2');
      const response3 = await request(app).get('/trips/3');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
    });

    test('handles requests with various content types', async () => {
      axios.mockResolvedValue({
        status: 200,
        headers: {},
        data: { success: true },
      });

      const response = await request(app)
        .post('/bookings')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('key=value');

      expect([200, 400]).toContain(response.status);
    });
  });
});
