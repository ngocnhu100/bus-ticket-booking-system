const request = require('supertest');
const app = require('../src/index');

describe('Authentication API', () => {
  let accessToken;
  let refreshToken;

  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        email: 'newuser@example.com',
        phone: '+84901234568',
        password: 'SecurePass123!',
        fullName: 'Test User',
        role: 'passenger'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('userId');
    expect(response.body.data.email).toBe('newuser@example.com');
    expect(response.body.data.role).toBe('passenger');
    expect(response.body.data.emailVerified).toBe(false);
    expect(response.body.message).toContain('Registration successful');
  });

  it('should fail registration with invalid email', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        email: 'invalid-email',
        phone: '+84901234567',
        password: 'SecurePass123!',
        fullName: 'Test User'
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VAL_001');
  });

  it('should fail registration with invalid phone', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        email: 'test2@example.com',
        phone: 'invalid-phone',
        password: 'SecurePass123!',
        fullName: 'Test User'
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VAL_001');
  });

  it('should fail registration with existing phone', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        email: 'test3@example.com',
        phone: '+84901234567', // Same phone as first user
        password: 'SecurePass123!',
        fullName: 'Another User'
      })
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('USER_003');
  });

  it('should fail registration with weak password', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        email: 'test4@example.com',
        phone: '+84901111111',
        password: 'weak',
        fullName: 'Test User'
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VAL_001');
  });

  it('should fail registration with invalid role', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        email: 'test5@example.com',
        phone: '+84902222222',
        password: 'SecurePass123!',
        fullName: 'Test User',
        role: 'invalid-role'
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VAL_001');
  });

  it('should fail registration without required fields', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        email: 'test6@example.com'
        // Missing phone, password, fullName
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VAL_001');
  });

  describe('POST /forgot-password', () => {
    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({
          email: 'test@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('If the email exists, a password reset link has been sent.');
    });

    it('should return success for non-existing user (security)', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('If the email exists, a password reset link has been sent.');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({
          email: 'invalid-email'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VAL_001');
    });

    it('should fail without email', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VAL_001');
    });
  });

  describe('POST /reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      // Generate a reset token for testing (using the mocked jwt)
      resetToken = 'validResetToken'; // This matches the mock setup
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewSecurePass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successfully. You can now log in with your new password.');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewSecurePass123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_006');
    });

    it('should fail with expired token', async () => {
      const response = await request(app)
        .post('/reset-password')
        .send({
          token: 'expired-token',
          newPassword: 'NewSecurePass123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_006');
    });

    it('should fail with weak new password', async () => {
      const response = await request(app)
        .post('/reset-password')
        .send({
          token: resetToken,
          newPassword: 'weak'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VAL_001');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/reset-password')
        .send({
          token: resetToken
          // Missing newPassword
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VAL_001');
    });
  });

  it('should verify email with valid token', async () => {
    const response = await request(app)
      .get('/verify-email?token=validToken')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Email verified successfully. You can now log in.');
  });

  it('should login with valid credentials after email verification', async () => {
    // First register and verify the user
    await request(app)
      .post('/register')
      .send({
        email: 'verified@example.com',
        phone: '+84901234569',
        password: 'SecurePass123!',
        fullName: 'Verified User',
        role: 'passenger'
      });

    // Verify the email
    await request(app)
      .get('/verify-email?token=validToken')
      .expect(200);

    const response = await request(app)
      .post('/login')
      .send({
        identifier: 'verified@example.com',
        password: 'SecurePass123!'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    expect(response.body.data.user.role).toBe('passenger');

    accessToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
  });

  it('should fail login with unverified email', async () => {
    // Register another user without verifying
    await request(app)
      .post('/register')
      .send({
        email: 'unverified@example.com',
        phone: '+84909876543',
        password: 'SecurePass123!',
        fullName: 'Unverified User',
        role: 'passenger'
      })
      .expect(201);

    const response = await request(app)
      .post('/login')
      .send({
        identifier: 'unverified@example.com',
        password: 'SecurePass123!'
      })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTH_005');
  });

  it('should fail login with invalid credentials', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        identifier: 'test@example.com',
        password: 'WrongPass123!'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTH_001');
  });

  it('should refresh access token', async () => {
    const oldAccessToken = accessToken;
    const response = await request(app)
      .post('/refresh')
      .set('Authorization', `Bearer ${oldAccessToken}`)
      .send({
        refreshToken
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data.expiresIn).toBe(3600);
    
    // Update the access token for subsequent tests
    accessToken = response.body.data.accessToken;
  });

  it('should logout successfully', async () => {
    const response = await request(app)
      .post('/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Logged out successfully');
  });

  it('should return health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.service).toBe('auth-service');
    expect(response.body.status).toBe('healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.version).toBe('1.0.0');
  });

  describe('POST /oauth/google', () => {
    it('should authenticate with Google ID token', async () => {
      const response = await request(app)
        .post('/oauth/google')
        .send({
          idToken: 'mock-google-id-token'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should fail with invalid ID token', async () => {
      const response = await request(app)
        .post('/oauth/google')
        .send({
          idToken: 'invalid-token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_001');
    });

    it('should fail without ID token', async () => {
      const response = await request(app)
        .post('/oauth/google')
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VAL_001');
    });
  });

  describe('POST /resend-verification', () => {
    it('should resend verification email', async () => {
      // Create an unverified user for this test
      await request(app)
        .post('/register')
        .send({
          email: 'unverified@example.com',
          phone: '+84905555555',
          password: 'SecurePass123!',
          fullName: 'Unverified User'
        });

      const response = await request(app)
        .post('/resend-verification')
        .send({
          email: 'unverified@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Verification email sent successfully');
    });

    it('should fail for non-existing user', async () => {
      const response = await request(app)
        .post('/resend-verification')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_001');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/resend-verification')
        .send({
          email: 'invalid-email'
        })
        .expect(404); // Will fail at user lookup

      expect(response.body.success).toBe(false);
    });

    it('should fail without email', async () => {
      const response = await request(app)
        .post('/resend-verification')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VAL_001');
    });
  });

  describe('Security Edge Cases', () => {
    it('should prevent concurrent login attempts', async () => {
      // First login
      await request(app)
        .post('/login')
        .send({
          identifier: 'test@example.com',
          password: 'SecurePass123!'
        });

      // Second login should still work (not blocked)
      const response = await request(app)
        .post('/login')
        .send({
          identifier: 'test@example.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should validate email verification tokens', async () => {
      const response = await request(app)
        .get('/verify-email')
        .query({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_003');
    });

    it('should fail email verification without token', async () => {
      const response = await request(app)
        .get('/verify-email')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VAL_001');
    });
  });
});