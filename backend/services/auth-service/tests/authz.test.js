const request = require('supertest');
const app = require('../src/index');
const jwt = require('jsonwebtoken');

describe('Authorization Middleware', () => {
  let passengerToken;
  let passengerRefreshToken;
  let adminToken;
  let adminRefreshToken;

  beforeAll(async () => {
    // Register and login as passenger
    await request(app)
      .post('/register')
      .send({
        email: 'passenger@example.com',
        phone: '+84901234569',
        password: 'SecurePass123!',
        fullName: 'Passenger User',
        role: 'passenger'
      });

    // Verify email for passenger
    await request(app)
      .get('/verify-email?token=validToken')
      .expect(200);

    const passengerLogin = await request(app)
      .post('/login')
      .send({
        identifier: 'passenger@example.com',
        password: 'SecurePass123!'
      });

    passengerToken = passengerLogin.body.data.accessToken;
    passengerRefreshToken = passengerLogin.body.data.refreshToken;

    // Register and login as admin
    await request(app)
      .post('/register')
      .send({
        email: 'admin@example.com',
        phone: '+84909876544',
        password: 'SecurePass123!',
        fullName: 'Admin User',
        role: 'admin'
      });

    // Verify email for admin
    await request(app)
      .get('/verify-email?token=validToken')
      .expect(200);

    const adminLogin = await request(app)
      .post('/login')
      .send({
        identifier: 'admin@example.com',
        password: 'SecurePass123!'
      });

    adminToken = adminLogin.body.data.accessToken;
    adminRefreshToken = adminLogin.body.data.refreshToken;
  });

  it('should allow authenticated user to refresh token', async () => {
    const response = await request(app)
      .post('/refresh')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        refreshToken: passengerRefreshToken
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    
    // Update token for subsequent tests
    passengerToken = response.body.data.accessToken;
  });

  it('should allow authenticated user to logout', async () => {
    const response = await request(app)
      .post('/logout')
      .set('Authorization', `Bearer ${passengerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Logged out successfully');
  });

  it('should deny access to protected endpoints without token', async () => {
    const response = await request(app)
      .post('/refresh')
      .send({
        refreshToken: 'some-refresh-token'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTH_001');
  });

  it('should deny access with invalid token', async () => {
    const response = await request(app)
      .post('/refresh')
      .set('Authorization', 'Bearer invalid-token')
      .send({
        refreshToken: 'some-refresh-token'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTH_002');
  });

  it('should deny access with expired token', async () => {
    // Create an expired token
    const expiredToken = jwt.sign(
      { userId: 1, email: 'test@example.com', role: 'passenger' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' }
    );

    const response = await request(app)
      .post('/refresh')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({
        refreshToken: 'some-refresh-token'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTH_002');
  });
});