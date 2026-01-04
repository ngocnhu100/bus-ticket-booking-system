const request = require('supertest');
const app = require('../src/index');
const axios = require('axios');
const bookingRepository = require('../src/repositories/bookingRepository');
const passengerRepository = require('../src/repositories/passengerRepository');
const redisClient = require('../src/redis');

// Mock dependencies
jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/passengerRepository');
jest.mock('../src/redis');
jest.mock('axios');

const mockUserId = 'user-456';

describe('Booking Service - API Tests', () => {
  const validBookingData = {
    tripId: '456e7890-e89b-12d3-a456-426614174001',
    seats: ['A1', 'A2'],
    passengers: [
      {
        fullName: 'Nguyen Van A',
        phone: '+84973994154',
        seatCode: 'A1'
      },
      {
        fullName: 'Tran Thi B',
        phone: '+84973994155',
        seatCode: 'A2'
      }
    ],
    contactEmail: 'user@example.com',
    contactPhone: '+84973994154'
  };

  describe('Health Check', () => {
    test('GET /health should return service status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.service).toBe('booking-service');
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Validation Tests', () => {
    test('should reject booking without tripId', async () => {
      const response = await request(app)
        .post('/')
        .send({ ...validBookingData, tripId: undefined });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject booking without seats', async () => {
      const response = await request(app)
        .post('/')
        .send({ ...validBookingData, seats: [] });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject booking with invalid email', async () => {
      const response = await request(app)
        .post('/')
        .send({ ...validBookingData, contactEmail: 'invalid-email' });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject booking with invalid phone format', async () => {
      const response = await request(app)
        .post('/')
        .send({ ...validBookingData, contactPhone: '123' });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject booking with more than 10 seats', async () => {
      const seats = Array.from({ length: 11 }, (_, i) => `A${i + 1}`);
      const passengers = seats.map((seat, i) => ({
        fullName: `Passenger ${i + 1}`,
        phone: '+84973994154',
        seatCode: seat
      }));

      const response = await request(app)
        .post('/')
        .send({
          ...validBookingData,
          seats,
          passengers
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });
  });
});
