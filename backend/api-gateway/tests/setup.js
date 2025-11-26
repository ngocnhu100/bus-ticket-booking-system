// Test setup for API Gateway
const nock = require('nock');
const jwt = require('jsonwebtoken');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.JWT_SECRET = 'test-secret';
process.env.AUTH_SERVICE_URL = 'http://localhost:3001';
process.env.NOTIFICATION_SERVICE_URL = 'http://localhost:3003';

// Generate valid JWT tokens for testing
const passengerToken = jwt.sign(
  { userId: 'test-user-id', email: 'passenger2@example.com', role: 'passenger' },
  'test-secret',
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  { userId: 'test-admin-id', email: 'admin2@example.com', role: 'admin' },
  'test-secret',
  { expiresIn: '1h' }
);

// Export tokens for use in tests
global.testTokens = {
  passenger: passengerToken,
  admin: adminToken
};

// Mock auth service responses for registration and login
// Mock successful registration
nock('http://localhost:3001')
  .persist()
  .post('/register')
  .reply(201, {
    success: true,
    data: {
      userId: 'test-user-id',
      email: 'passenger2@example.com',
      phone: '+84901234568',
      fullName: 'Passenger User 2',
      role: 'passenger',
      emailVerified: false,
      createdAt: new Date().toISOString()
    },
    message: 'Registration successful. Please check your email to verify your account.',
    timestamp: new Date().toISOString()
  });

// Mock token verification
nock('http://localhost:3001')
  .persist()
  .post('/verify')
  .reply(200, function(uri, requestBody) {
    const { token } = requestBody;
    try {
      const decoded = jwt.verify(token, 'test-secret');
      return {
        success: true,
        data: {
          valid: true,
          user: {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        data: { valid: false },
        error: { code: 'AUTH_002', message: 'Token expired or invalid' },
        timestamp: new Date().toISOString()
      };
    }
  });

// Mock successful login for passenger
nock('http://localhost:3001')
  .persist()
  .post('/login')
  .reply(200, function(uri, requestBody) {
    // requestBody is already parsed by axios as an object
    const { identifier } = requestBody;
    if (identifier === 'passenger2@example.com') {
      return {
        success: true,
        data: {
          accessToken: passengerToken,
          refreshToken: 'mock-passenger-refresh-token',
          expiresIn: 3600,
          user: {
            userId: 'test-user-id',
            email: 'passenger2@example.com',
            fullName: 'Passenger User 2',
            role: 'passenger'
          }
        },
        timestamp: new Date().toISOString()
      };
    } else if (identifier === 'admin2@example.com') {
      return {
        success: true,
        data: {
          accessToken: adminToken,
          refreshToken: 'mock-admin-refresh-token',
          expiresIn: 3600,
          user: {
            userId: 'test-admin-id',
            email: 'admin2@example.com',
            fullName: 'Admin User 2',
            role: 'admin'
          }
        },
        timestamp: new Date().toISOString()
      };
    }
    return {
      success: false,
      error: { code: 'AUTH_001', message: 'Invalid credentials' },
      timestamp: new Date().toISOString()
    };
  });

console.log('🧪 API Gateway test setup loaded');