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
const passwordResetUsers = new Set(); // Track users who have reset passwords

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
  compare: jest.fn((password, hash) => {
    if (password === 'WrongPassword123!') return Promise.resolve(false);
    if (password === 'WrongPass123!') return Promise.resolve(false);
    if (password === 'SecurePass123!' && hash === 'hashedPassword') return Promise.resolve(true);
    if (password === 'SecurePass123!' && hash === '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6I3XzHHUyO') return Promise.resolve(true);
    if (password === 'NewSecurePass456!') return Promise.resolve(false);
    if (password === 'OldSecurePass123!') return Promise.resolve(true);
    if (password === 'NewSecurePass123!') return Promise.resolve(true);
    return Promise.resolve(false); // Default false
  }),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockToken'),
  verify: jest.fn(() => ({ userId: 1, email: 'test@example.com', role: 'passenger' })),
}));

// Mock google-auth-library
let mockGooglePayload = {
  sub: 'googleId',
  email: 'google@example.com',
  name: 'Google User',
  email_verified: true
};

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({
    verifyIdToken: jest.fn((options) => {
      if (options.idToken === 'invalid-token') {
        return Promise.reject(new Error('Invalid token'));
      }
      return Promise.resolve({
        getPayload: () => mockGooglePayload
      });
    })
  }))
}));

// Function to set mock Google payload for tests
global.setMockGooglePayload = (payload) => {
  mockGooglePayload = payload;
};

// Function to clear mock state between tests
global.clearMockState = () => {
  mockUsedResetTokens.clear();
  mockFailedAttempts.clear();
  mockRegisteredUsers.clear();
  mockRegisteredPhones.clear();
  mockVerifiedEmails.clear();
  mockUserData.clear();
  mockLastCreatedUser = null;
  mockBlacklistedTokens.clear();

  // Re-add initial test users
  mockRegisteredUsers.add('existing@example.com');
  mockRegisteredUsers.add('test@example.com');
  mockRegisteredUsers.add('passenger@example.com');
  mockRegisteredUsers.add('admin@example.com');
  mockRegisteredUsers.add('admin2@example.com');
  mockRegisteredUsers.add('passenger2@example.com');
  mockVerifiedEmails.add('verified@example.com');
  mockVerifiedEmails.add('test@example.com');
  mockVerifiedEmails.add('passenger@example.com');
  mockVerifiedEmails.add('admin@example.com');
  mockRegisteredPhones.add('+84901234567');
};

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
const mockUserData = new Map(); // Store user data by email
let mockLastCreatedUser = null; // Track the last created user for verification
const mockUsedResetTokens = new Set(); // Track used reset tokens for single-use validation
const mockFailedAttempts = new Map(); // Track failed login attempts per email

jest.mock('../src/userRepository', () => ({
  create: jest.fn((userData) => {
    mockRegisteredUsers.add(userData.email);
    if (userData.phone) {
      mockRegisteredPhones.add(userData.phone);
    }
    const user = {
      user_id: Date.now(), // Use timestamp to make IDs unique
      email: userData.email,
      phone: userData.phone,
      full_name: userData.fullName,
      role: userData.role,
      email_verified: userData.emailVerified || false, // Users start unverified unless specified
      created_at: new Date(),
      password_hash: userData.passwordHash || 'hashedPassword',
      failed_login_attempts: 0,
      account_locked_until: null
    };
    mockUserData.set(userData.email, user);
    mockLastCreatedUser = user; // Track for verification
    return Promise.resolve(user);
  }),
  findByEmail: jest.fn((email) => {
    if (mockUserData.has(email)) {
      return Promise.resolve(mockUserData.get(email));
    }
    if (mockRegisteredUsers.has(email)) {
      const failedAttempts = mockFailedAttempts.get(email) || 0;
      let lockUntil = null;
      if (failedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 10000); // Lock for 10 seconds
      }
      if (email === 'locked@example.com') {
        lockUntil = new Date(Date.now() + 10000); // Always locked for this test user
      }
      return Promise.resolve({
        user_id: 1,
        email,
        password_hash: 'hashedPassword',
        role: email.includes('admin') ? 'admin' : 'passenger',
        full_name: 'Test User',
        email_verified: mockVerifiedEmails.has(email), // Check if email has been verified
        failed_login_attempts: failedAttempts,
        account_locked_until: lockUntil
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
    role: 'passenger',
    password_hash: 'hashedPassword'
  })),
  findByGoogleId: jest.fn(() => Promise.resolve(null)),
  updateGoogleId: jest.fn(() => Promise.resolve({})),
  setEmailVerificationToken: jest.fn(() => Promise.resolve({})),
  findByEmailVerificationToken: jest.fn((token) => {
    if (token === 'validToken') {
      if (mockLastCreatedUser) {
        return Promise.resolve(mockLastCreatedUser);
      } else {
        return Promise.resolve({
          user_id: 1,
          email: 'test@example.com',
          email_verified: false
        });
      }
    }
    return Promise.resolve(null);
  }),
  verifyEmail: jest.fn((userId) => {
    // Find and update the user by userId
    for (let [, user] of mockUserData) {
      if (user.user_id === userId) {
        user.email_verified = true;
        return Promise.resolve(user);
      }
    }
    // Fallback for hardcoded users
    mockVerifiedEmails.add('verified@example.com');
    mockVerifiedEmails.add('test@example.com');
    mockVerifiedEmails.add('passenger@example.com');
    mockVerifiedEmails.add('admin@example.com');
    mockVerifiedEmails.add('changepass@example.com');
    return Promise.resolve({
      user_id: userId,
      email: 'verified@example.com',
      email_verified: true
    });
  }),
  setPasswordResetToken: jest.fn(() => Promise.resolve({})),
  findByPasswordResetToken: jest.fn((token) => {
    if (token === 'validResetToken' || token === 'singleUseToken' || token === 'invalidateOldToken' || token === 'samePasswordToken') {
      if (mockUsedResetTokens.has(token) && token !== 'validResetToken') {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        user_id: 1,
        email: 'test@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6I3XzHHUyO' // hash for 'SecurePass123!'
      });
    }
    return Promise.resolve(null);
  }),
  updatePassword: jest.fn((userId, passwordHash) => {
    // Mark the token as used when password is updated (simulates clearing from DB)
    // For simplicity, we'll mark all used tokens, but in reality, we'd clear the specific token
    mockUsedResetTokens.add('validResetToken');
    mockUsedResetTokens.add('singleUseToken');
    mockUsedResetTokens.add('invalidateOldToken');
    mockUsedResetTokens.add('samePasswordToken');
    return Promise.resolve({
      user_id: userId,
      email: 'test@example.com',
      password_hash: passwordHash
    });
  }),
  updateFailedLoginAttempts: jest.fn((userId, attempts, lockUntil) => {
    // For testing, we'll track by email instead of userId
    // In a real scenario, we'd need to map userId to email
    // For now, assume userId 1 corresponds to lockout@example.com for testing
    if (userId === 1) {
      mockFailedAttempts.set('lockout@example.com', attempts);
    }
    return Promise.resolve({
      user_id: userId,
      failed_login_attempts: attempts,
      account_locked_until: lockUntil
    });
  }),
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
const mockAxiosCalls = [];
jest.mock('axios', () => ({
  post: jest.fn((url, data) => {
    mockAxiosCalls.push({ url, data, method: 'post' });
    return Promise.resolve({ data: { success: true } });
  }),
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

// Function to clear mock state between tests
global.clearMockState = () => {
  mockUsedResetTokens.clear();
  mockFailedAttempts.clear();
  mockRegisteredUsers.clear();
  mockRegisteredPhones.clear();
  mockVerifiedEmails.clear();
  mockUserData.clear();
  mockLastCreatedUser = null;
  mockBlacklistedTokens.clear();

  // Re-add initial test users
  mockRegisteredUsers.add('existing@example.com');
  mockRegisteredUsers.add('test@example.com');
  mockRegisteredUsers.add('passenger@example.com');
  mockRegisteredUsers.add('admin@example.com');
  mockRegisteredUsers.add('admin2@example.com');
  mockRegisteredUsers.add('passenger2@example.com');
  mockRegisteredUsers.add('locked@example.com');
  mockRegisteredUsers.add('lockout@example.com'); // For account lockout test
  mockVerifiedEmails.add('verified@example.com');
  mockVerifiedEmails.add('test@example.com');
  mockVerifiedEmails.add('passenger@example.com');
  mockVerifiedEmails.add('admin@example.com');
  mockVerifiedEmails.add('locked@example.com');
  mockVerifiedEmails.add('lockout@example.com');
  mockRegisteredPhones.add('+84901234567');
};