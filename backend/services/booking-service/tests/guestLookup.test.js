const request = require('supertest');
const app = require('../src/index');
const bookingRepository = require('../src/repositories/bookingRepository');
const passengerRepository = require('../src/repositories/passengerRepository');

// Mock repositories
jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/passengerRepository');
jest.mock('../src/redis');

describe('Guest Booking Lookup API', () => {
  const mockBooking = {
    bookingId: '123e4567-e89b-12d3-a456-426614174000',
    bookingReference: 'ABC123',
    tripId: '456e7890-e89b-12d3-a456-426614174001',
    userId: null, // Guest booking
    contactEmail: 'guest@example.com',
    contactPhone: '+84973994154',
    status: 'pending',
    lockedUntil: new Date(Date.now() + 600000).toISOString(),
    subtotal: 500000,
    serviceFee: 25000,
    totalPrice: 525000,
    currency: 'VND',
    createdAt: new Date().toISOString()
  };

  const mockPassengers = [
    {
      passengerId: 1,
      bookingId: mockBooking.bookingId,
      fullName: 'Nguyen Van A',
      phone: '+84973994154',
      seatCode: '1A',
      price: 500000
    }
  ];

  const mockTrip = {
    tripId: mockBooking.tripId,
    route: {
      origin: 'Ho Chi Minh City',
      destination: 'Da Lat'
    },
    operator: {
      name: 'Phuong Trang'
    },
    schedule: {
      departureTime: '2025-12-15T08:00:00Z',
      arrivalTime: '2025-12-15T14:00:00Z'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /guest/lookup', () => {
    describe('Success Cases', () => {
      test('should return booking when valid reference and phone provided', async () => {
        bookingRepository.findByReference.mockResolvedValue(mockBooking);
        passengerRepository.findByBookingId.mockResolvedValue(mockPassengers);

        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123',
            phone: '+84973994154'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('bookingId');
        expect(response.body.data.bookingReference).toBe('ABC123');
        expect(response.body.data.contactPhone).toBe('+84973994154');
        expect(response.body.data.passengers).toHaveLength(1);
        expect(response.body).toHaveProperty('timestamp');
      });

      test('should return booking when valid reference and email provided', async () => {
        bookingRepository.findByReference.mockResolvedValue(mockBooking);
        passengerRepository.findByBookingId.mockResolvedValue(mockPassengers);

        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123',
            email: 'guest@example.com'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.contactEmail).toBe('guest@example.com');
      });

      test('should handle phone with spaces and 0 prefix', async () => {
        bookingRepository.findByReference.mockResolvedValue(mockBooking);
        passengerRepository.findByBookingId.mockResolvedValue(mockPassengers);

        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123',
            phone: '0973994154' // Vietnamese format
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should handle case-insensitive email comparison', async () => {
        bookingRepository.findByReference.mockResolvedValue(mockBooking);
        passengerRepository.findByBookingId.mockResolvedValue(mockPassengers);

        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123',
            email: 'GUEST@EXAMPLE.COM' // Uppercase
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Error Cases - 404 Not Found', () => {
      test('should return 404 when booking reference does not exist', async () => {
        bookingRepository.findByReference.mockResolvedValue(null);

        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'NOTFND',
            phone: '+84973994154'
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('BOOKING_404');
        expect(response.body.error.message).toContain('not found');
        expect(response.body).toHaveProperty('timestamp');
      });
    });

    describe('Error Cases - 403 Contact Mismatch', () => {
      test('should return 403 when phone does not match', async () => {
        bookingRepository.findByReference.mockResolvedValue(mockBooking);

        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123',
            phone: '+84999999999' // Wrong phone
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('BOOKING_403');
        expect(response.body.error.message).toContain('does not match');
      });

      test('should return 403 when email does not match', async () => {
        bookingRepository.findByReference.mockResolvedValue(mockBooking);

        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123',
            email: 'wrong@example.com' // Wrong email
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('BOOKING_403');
      });
    });

    describe('Error Cases - 400 Bad Request', () => {
      test('should return 400 when bookingReference is missing', async () => {
        const response = await request(app)
          .get('/guest/lookup')
          .query({
            phone: '+84973994154'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VAL_001');
        expect(response.body.error.message).toContain('required');
      });

      test('should return 400 when neither phone nor email provided', async () => {
        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VAL_001');
        expect(response.body.error.message).toContain('phone or email');
      });

      test('should return 400 when bookingReference format is invalid', async () => {
        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'INVALID', // Not 6 chars
            phone: '+84973994154'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VAL_001');
      });

      test('should return 400 when phone format is invalid', async () => {
        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123',
            phone: '123' // Invalid format
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VAL_001');
      });

      test('should return 400 when email format is invalid', async () => {
        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123',
            email: 'not-an-email'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VAL_001');
      });
    });

    describe('Data Integrity', () => {
      test('should return complete booking structure', async () => {
        bookingRepository.findByReference.mockResolvedValue(mockBooking);
        passengerRepository.findByBookingId.mockResolvedValue(mockPassengers);

        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123',
            phone: '+84973994154'
          });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('bookingId');
        expect(response.body.data).toHaveProperty('bookingReference');
        expect(response.body.data).toHaveProperty('status');
        expect(response.body.data).toHaveProperty('totalPrice');
        expect(response.body.data).toHaveProperty('passengers');
        expect(response.body.data).toHaveProperty('tripDetails');
      });

      test('should not expose sensitive data unnecessarily', async () => {
        bookingRepository.findByReference.mockResolvedValue(mockBooking);
        passengerRepository.findByBookingId.mockResolvedValue(mockPassengers);

        const response = await request(app)
          .get('/guest/lookup')
          .query({
            bookingReference: 'ABC123',
            phone: '+84973994154'
          });

        expect(response.status).toBe(200);
        // Should not expose internal IDs or sensitive fields
        expect(response.body.data).not.toHaveProperty('password');
        expect(response.body.data).not.toHaveProperty('salt');
      });
    });
  });
});
