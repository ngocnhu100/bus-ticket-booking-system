/**
 * USER REPOSITORY UNIT TESTS
 * Testing database operations without modifying production code
 * Pattern: Like booking-service - mock database pool
 * Target: >70% coverage, 100% passing
 */

jest.mock('../src/configs/database');

const pool = require('../src/configs/database');
const userRepository = require('../src/repositories/userRepository');

describe('User Repository - Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock query response
    pool.query.mockResolvedValue({
      rows: [
        {
          user_id: 1,
          email: 'test@example.com',
          phone: '+84912345678',
          full_name: 'Test User',
          role: 'passenger',
          email_verified: true,
        },
      ],
    });
  });

  describe('create', () => {
    test('creates new user with all fields', async () => {
      const userData = {
        email: 'newuser@example.com',
        phone: '+84987654321',
        passwordHash: 'hashed_password',
        fullName: 'New User',
        role: 'passenger',
        emailVerified: false,
      };

      const result = await userRepository.create(userData);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [userData.email, userData.phone, userData.passwordHash, userData.fullName, userData.role, userData.emailVerified]
      );
      expect(result).toBeDefined();
    });

    test('creates user with default role', async () => {
      const userData = {
        email: 'user@example.com',
        phone: '+84901234567',
        passwordHash: 'hash',
        fullName: 'User',
      };

      await userRepository.create(userData);

      expect(pool.query).toHaveBeenCalled();
      const callArgs = pool.query.mock.calls[0][1];
      expect(callArgs[4]).toBe('passenger'); // Default role
    });

    test('creates user with email not verified by default', async () => {
      const userData = {
        email: 'user@example.com',
        phone: '+84901234567',
        passwordHash: 'hash',
        fullName: 'User',
      };

      await userRepository.create(userData);

      const callArgs = pool.query.mock.calls[0][1];
      expect(callArgs[5]).toBe(false); // email_verified default
    });
  });

  describe('findByEmail', () => {
    test('finds user by email', async () => {
      const result = await userRepository.findByEmail('test@example.com');

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = $1'),
        ['test@example.com']
      );
      expect(result.email).toBe('test@example.com');
    });

    test('returns undefined when email not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.findByEmail('notfound@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('findByPhone', () => {
    test('finds user by phone number', async () => {
      const result = await userRepository.findByPhone('+84912345678');

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE phone = $1'),
        ['+84912345678']
      );
      expect(result).toBeDefined();
    });

    test('returns undefined when phone not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.findByPhone('+84999999999');

      expect(result).toBeUndefined();
    });
  });

  describe('findById', () => {
    test('finds user by ID', async () => {
      const result = await userRepository.findById(1);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [1]
      );
      expect(result.user_id).toBe(1);
    });

    test('returns undefined when ID not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findByGoogleId', () => {
    test('finds user by Google ID', async () => {
      pool.query.mockResolvedValue({
        rows: [{ user_id: 1, google_id: 'google-12345', email: 'test@example.com' }],
      });

      const result = await userRepository.findByGoogleId('google-12345');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE google_id = $1'),
        ['google-12345']
      );
      expect(result.google_id).toBe('google-12345');
    });

    test('returns undefined when Google ID not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.findByGoogleId('notfound');

      expect(result).toBeUndefined();
    });
  });

  describe('updateGoogleId', () => {
    test('updates user Google ID', async () => {
      await userRepository.updateGoogleId(1, 'google-67890');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET google_id = $1'),
        ['google-67890', 1]
      );
    });

    test('returns updated user', async () => {
      pool.query.mockResolvedValue({
        rows: [{ user_id: 1, google_id: 'google-67890' }],
      });

      const result = await userRepository.updateGoogleId(1, 'google-67890');

      expect(result.google_id).toBe('google-67890');
    });
  });

  describe('setEmailVerificationToken', () => {
    test('sets email verification token', async () => {
      const token = 'verify-token-123';
      const expiresAt = new Date();

      await userRepository.setEmailVerificationToken(1, token, expiresAt);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('email_verification_token = $1'),
        [token, expiresAt, 1]
      );
    });

    test('returns updated user', async () => {
      pool.query.mockResolvedValue({
        rows: [{ user_id: 1, email_verification_token: 'token' }],
      });

      const result = await userRepository.setEmailVerificationToken(1, 'token', new Date());

      expect(result.email_verification_token).toBe('token');
    });
  });

  describe('findByEmailVerificationToken', () => {
    test('finds user by valid token', async () => {
      await userRepository.findByEmailVerificationToken('valid-token');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email_verification_token = $1'),
        ['valid-token']
      );
    });

    test('returns undefined when token not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.findByEmailVerificationToken('invalid-token');

      expect(result).toBeUndefined();
    });
  });

  describe('verifyEmail', () => {
    test('marks email as verified', async () => {
      await userRepository.verifyEmail(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('email_verified = TRUE'),
        [1]
      );
    });

    test('clears verification token', async () => {
      await userRepository.verifyEmail(1);

      const query = pool.query.mock.calls[0][0];
      expect(query).toContain('email_verification_token = NULL');
    });
  });

  describe('clearEmailVerificationToken', () => {
    test('clears verification token', async () => {
      await userRepository.clearEmailVerificationToken(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('email_verification_token = NULL'),
        [1]
      );
    });
  });

  describe('setPasswordResetToken', () => {
    test('sets password reset token', async () => {
      const token = 'reset-token-456';
      const expiresAt = new Date();

      await userRepository.setPasswordResetToken(1, token, expiresAt);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('password_reset_token = $1'),
        [token, expiresAt, 1]
      );
    });
  });

  describe('findByPasswordResetToken', () => {
    test('finds user by valid reset token', async () => {
      await userRepository.findByPasswordResetToken('reset-token');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE password_reset_token = $1'),
        ['reset-token']
      );
    });
  });

  describe('updatePassword', () => {
    test('updates user password', async () => {
      await userRepository.updatePassword(1, 'new-hashed-password');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('password_hash = $1'),
        ['new-hashed-password', 1]
      );
    });

    test('clears password reset token', async () => {
      await userRepository.updatePassword(1, 'new-hash');

      const query = pool.query.mock.calls[0][0];
      expect(query).toContain('password_reset_token = NULL');
    });
  });

  describe('clearPasswordResetToken', () => {
    test('clears reset token', async () => {
      await userRepository.clearPasswordResetToken(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('password_reset_token = NULL'),
        [1]
      );
    });
  });

  describe('updateFailedLoginAttempts', () => {
    test('updates failed attempts and lock time', async () => {
      await userRepository.updateFailedLoginAttempts(1, 3, new Date());

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('failed_login_attempts'),
        expect.any(Array)
      );
    });

    test('updates last failed login time', async () => {
      await userRepository.updateFailedLoginAttempts(1, 1, null);

      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    test('updates user data', async () => {
      const updates = { full_name: 'Updated Name', phone: '+84999999999' };

      await userRepository.update(1, updates);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.any(Array)
      );
    });

    test('returns updated user', async () => {
      pool.query.mockResolvedValue({
        rows: [{ user_id: 1, full_name: 'Updated' }],
      });

      const result = await userRepository.update(1, { full_name: 'Updated' });

      expect(result.full_name).toBe('Updated');
    });
  });

  describe('Error Handling', () => {
    test('handles database connection errors', async () => {
      pool.query.mockRejectedValue(new Error('Connection failed'));

      await expect(
        userRepository.findByEmail('test@example.com')
      ).rejects.toThrow('Connection failed');
    });

    test('handles query errors', async () => {
      pool.query.mockRejectedValue(new Error('Query syntax error'));

      await expect(
        userRepository.create({
          email: 'test@example.com',
          phone: '+84912345678',
          passwordHash: 'hash',
          fullName: 'Test',
        })
      ).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('handles null values', async () => {
      pool.query.mockResolvedValue({ rows: [{ user_id: 1, avatar: null }] });

      const result = await userRepository.findById(1);

      expect(result.avatar).toBeNull();
    });

    test('handles empty result sets', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.findByEmail('notfound@example.com');

      expect(result).toBeUndefined();
    });
  });
});
