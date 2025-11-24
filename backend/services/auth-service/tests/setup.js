const { Pool } = require('pg');

// Mock the pg Pool
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
};

mockPool.query
  .mockImplementation((query, params) => {
    if (query.includes('INSERT INTO users')) {
      return Promise.resolve({ rows: [{ user_id: 1, email: params[0], phone: params[1], full_name: params[3], role: params[4] || 'passenger', created_at: new Date() }] });
    }
    if (query.includes('SELECT * FROM users WHERE email')) {
      // For login tests, return a user
      if (params && (params[0] === 'test@example.com' || params[0] === 'passenger@example.com' || params[0] === 'passenger2@example.com' || params[0] === 'admin@example.com' || params[0] === 'admin2@example.com')) {
        return Promise.resolve({ rows: [{ user_id: 1, email: params[0], password_hash: 'hashedPassword', role: params[0].includes('admin') ? 'admin' : 'passenger', full_name: 'Test User' }] });
      }
      if (params && params[0] === 'existing@example.com') {
        return Promise.resolve({ rows: [{ user_id: 1, email: 'existing@example.com', password_hash: 'hashed', role: 'passenger' }] });
      }
      return Promise.resolve({ rows: [] });
    }
    if (query.includes('SELECT * FROM users WHERE id') || query.includes('SELECT user_id')) {
      return Promise.resolve({ rows: [{ user_id: 1, email: 'test@example.com', role: 'passenger' }] });
    }
    return Promise.resolve({ rows: [] });
  });

jest.mock('pg', () => {
  return { Pool: jest.fn(() => mockPool) };
});

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  })),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
  compare: jest.fn((password, hash) => Promise.resolve(password === 'SecurePass123!')),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockToken'),
  verify: jest.fn(() => ({ userId: 1, email: 'test@example.com', role: 'passenger' })),
}));

// Mock google-auth-library
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({
    verifyIdToken: jest.fn((options) => {
      if (options.idToken === 'invalid-token') {
        return Promise.reject(new Error('Invalid token'));
      }
      return Promise.resolve({
        getPayload: () => ({
          sub: 'googleId',
          email: 'google@example.com',
          name: 'Google User',
        }),
      });
    }),
  })),
}));

// Mock userRepository
const mockRegisteredUsers = new Set([
  'existing@example.com',
  'test@example.com',
  'verified@example.com',
  'passenger@example.com',
  'admin@example.com',
  'admin2@example.com',
  'passenger2@example.com'
]);
const mockRegisteredPhones = new Set(['+84901234567']);
const mockVerifiedEmails = new Set([
  'verified@example.com',
  'test@example.com',
  'passenger@example.com',
  'admin@example.com'
]);

jest.mock('../src/userRepository', () => ({
  create: jest.fn((userData) => {
    mockRegisteredUsers.add(userData.email);
    if (userData.phone) {
      mockRegisteredPhones.add(userData.phone);
    }
    return Promise.resolve({
      user_id: Date.now(), // Use timestamp to make IDs unique
      email: userData.email,
      phone: userData.phone,
      full_name: userData.fullName,
      role: userData.role,
      email_verified: false, // Users start unverified
      created_at: new Date()
    });
  }),
  findByEmail: jest.fn((email) => {
    if (mockRegisteredUsers.has(email)) {
      return Promise.resolve({
        user_id: 1,
        email,
        password_hash: 'hashedPassword',
        role: email.includes('admin') ? 'admin' : 'passenger',
        full_name: 'Test User',
        email_verified: mockVerifiedEmails.has(email) // Check if email has been verified
      });
    }
    return Promise.resolve(null);
  }),
  findByPhone: jest.fn((phone) => {
    if (mockRegisteredPhones.has(phone)) {
      return Promise.resolve({
        user_id: 1,
        email: 'existing@example.com',
        phone,
        password_hash: 'hashedPassword',
        role: 'passenger',
        full_name: 'Test User'
      });
    }
    return Promise.resolve(null);
  }),
  findById: jest.fn(() => Promise.resolve({
    user_id: 1,
    email: 'test@example.com',
    role: 'passenger'
  })),
  findByGoogleId: jest.fn(() => Promise.resolve(null)),
  updateGoogleId: jest.fn(() => Promise.resolve({})),
  setEmailVerificationToken: jest.fn(() => Promise.resolve({})),
  findByEmailVerificationToken: jest.fn((token) => {
    if (token === 'validToken') {
      return Promise.resolve({
        user_id: 1,
        email: 'test@example.com',
        email_verified: false
      });
    }
    return Promise.resolve(null);
  }),
  verifyEmail: jest.fn((userId) => {
    // Mark the user as verified - in a real app we'd look up by userId
    // For testing, we'll assume the last verification was for the test user
    mockVerifiedEmails.add('verified@example.com');
    mockVerifiedEmails.add('test@example.com');
    mockVerifiedEmails.add('passenger@example.com');
    mockVerifiedEmails.add('admin@example.com');
    return Promise.resolve({
      user_id: userId,
      email: 'verified@example.com',
      email_verified: true
    });
  }),
  setPasswordResetToken: jest.fn(() => Promise.resolve({})),
  findByPasswordResetToken: jest.fn((token) => {
    if (token === 'validResetToken') {
      return Promise.resolve({
        user_id: 1,
        email: 'test@example.com'
      });
    }
    return Promise.resolve(null);
  }),
  updatePassword: jest.fn(() => Promise.resolve({})),
}));

// Mock authService
const mockBlacklistedTokens = new Set();

jest.mock('../src/authService', () => ({
  generateAccessToken: jest.fn((payload) => `token_${payload.role}_${Date.now()}`),
  generateRefreshToken: jest.fn(() => 'mockRefreshToken'),
  verifyAccessToken: jest.fn((token) => {
    if (token && token.startsWith('token_') && !mockBlacklistedTokens.has(token)) {
      const role = token.includes('admin') ? 'admin' : 'passenger';
      return { userId: 1, email: 'test@example.com', role, exp: Math.floor(Date.now() / 1000) + 3600 };
    }
    return null;
  }),
  verifyRefreshToken: jest.fn(() => ({ userId: 1, role: 'passenger' })),
  storeRefreshToken: jest.fn(() => Promise.resolve()),
  getRefreshToken: jest.fn(() => Promise.resolve('mockRefreshToken')),
  deleteRefreshToken: jest.fn(() => Promise.resolve()),
  blacklistAccessToken: jest.fn((token) => {
    mockBlacklistedTokens.add(token);
    return Promise.resolve();
  }),
  isTokenBlacklisted: jest.fn((token) => Promise.resolve(mockBlacklistedTokens.has(token))),
}));

// Mock axios for inter-service communication
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({ data: { success: true } })),
  get: jest.fn(() => Promise.resolve({ data: { success: true } })),
  put: jest.fn(() => Promise.resolve({ data: { success: true } })),
  delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
}));

// Set test environment variables BEFORE requiring any modules
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'bus_ticket_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use DB 1 for tests
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.NOTIFICATION_SERVICE_URL = 'http://localhost:3003';
process.env.PORT = '3002';