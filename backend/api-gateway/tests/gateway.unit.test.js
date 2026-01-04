/**
 * API GATEWAY UNIT TESTS
 * Testing routing logic, error handling, and middleware
 * Pattern: Mock external service calls, test gateway behavior
 * Target: >70% coverage, 100% passing
 */

const request = require('supertest');
const axios = require('axios');

// Mock axios before requiring app
jest.mock('axios');

// Mock auth middleware
jest.mock('../src/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = { id: 'user123', role: 'passenger' };
      return next();
    }
    return res.status(401).json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' }});
  },
  authorize: (...roles) => (req, res, next) => {
    if (roles.includes(req.user?.role)) {
      return next();
    }
    return res.status(403).json({ success: false, error: { code: 'AUTH_003', message: 'Forbidden' }});
  },
}));

const app = require('../src/index');

describe('API Gateway - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    test('returns health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        service: 'api-gateway',
        status: 'healthy',
        version: '1.0.0',
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Auth Service Proxy', () => {
    test('proxies login request to auth service', async () => {
      axios.mockResolvedValue({
        status: 200,
        data: { success: true, token: 'test-token' },
        headers: {},
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringContaining('/login'), // Gateway strips /auth prefix
        })
      );
    });

    test('handles auth service errors', async () => {
      axios.mockRejectedValue({
        response: {
          status: 401,
          data: { success: false, error: { code: 'AUTH_001', message: 'Invalid credentials' }},
        },
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrong' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('handles auth service unavailable', async () => {
      axios.mockRejectedValue(new Error('ECONNREFUSED'));

      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'pass' })
        .expect(500);

      expect(response.body.error.code).toBe('GATEWAY_001');
    });
  });

  describe('User Service Proxy', () => {
    test('proxies user profile requests', async () => {
      axios.mockResolvedValue({
        status: 200,
        data: { success: true, data: { name: 'Test User', email: 'test@example.com' }},
        headers: {},
      });

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(axios).toHaveBeenCalled();
    });

    test('proxies password change requests', async () => {
      axios.mockResolvedValue({
        status: 200,
        data: { success: true, message: 'Password changed' },
        headers: {},
      });

      const response = await request(app)
        .post('/users/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({ oldPassword: 'old', newPassword: 'new' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('handles user service errors', async () => {
      axios.mockRejectedValue({
        response: {
          status: 400,
          data: { success: false, error: { message: 'Invalid data' }},
        },
      });

      const response = await request(app)
        .post('/users/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({ oldPassword: 'wrong' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('handles timeout errors', async () => {
      axios.mockRejectedValue({ code: 'ECONNABORTED' });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' })
        .expect(500);

      expect(response.body.error.code).toBe('GATEWAY_001');
    });

    test('handles network errors', async () => {
      axios.mockRejectedValue({ code: 'ENETUNREACH' });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'pass' })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Request Forwarding', () => {
    test('forwards headers correctly', async () => {
      axios.mockResolvedValue({
        status: 200,
        data: { success: true },
        headers: { 'x-custom-header': 'value' },
      });

      await request(app)
        .post('/auth/verify')
        .set('Authorization', 'Bearer token')
        .send({ token: 'verify-token' })
        .expect(200);

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: 'Bearer token',
          }),
        })
      );
    });

    test('forwards query parameters', async () => {
      axios.mockResolvedValue({
        status: 200,
        data: { success: true, data: [] },
        headers: {},
      });

      await request(app)
        .get('/auth/users?page=1&limit=10')
        .expect(200);

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('page=1&limit=10'),
        })
      );
    });
  });

  describe('CORS Configuration', () => {
    test('allows requests from allowed origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Request Body Parsing', () => {
    test('parses JSON bodies', async () => {
      axios.mockResolvedValue({
        status: 200,
        data: { success: true },
        headers: {},
      });

      await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'pass' })
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@test.com',
          }),
        })
      );
    });
  });
});
