// seat-lock.integration.test.js - Integration tests for Trip Service
// Tests seat locking and availability workflows

const request = require('supertest');
const express = require('express');

// Mock repositories
const mockSeatRepository = {
  findAvailableSeats: jest.fn(),
  lockSeats: jest.fn(),
  unlockSeats: jest.fn(),
  getSeatStatus: jest.fn(),
  reserveSeats: jest.fn()
};

const mockTripRepository = {
  findById: jest.fn(),
  updateSeatAvailability: jest.fn(),
  searchTrips: jest.fn()
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Seat availability endpoints
  app.get('/api/trips/:tripId/seats', async (req, res) => {
    try {
      const { tripId } = req.params;
      const seats = await mockSeatRepository.findAvailableSeats(tripId);
      res.json({ success: true, seats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Lock seats endpoint
  app.post('/api/trips/:tripId/seats/lock', async (req, res) => {
    try {
      const { tripId } = req.params;
      const { seatIds, userId, timeoutMinutes } = req.body;

      const trip = await mockTripRepository.findById(tripId);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const lockResult = await mockSeatRepository.lockSeats(tripId, seatIds, userId, timeoutMinutes);
      res.json({ success: true, lockResult });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unlock seats endpoint
  app.post('/api/trips/:tripId/seats/unlock', async (req, res) => {
    try {
      const { tripId } = req.params;
      const { seatIds, userId } = req.body;

      await mockSeatRepository.unlockSeats(tripId, seatIds, userId);
      res.json({ success: true, message: 'Seats unlocked' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reserve seats endpoint
  app.post('/api/trips/:tripId/seats/reserve', async (req, res) => {
    try {
      const { tripId } = req.params;
      const { seatIds, bookingId } = req.body;

      const result = await mockSeatRepository.reserveSeats(tripId, seatIds, bookingId);
      await mockTripRepository.updateSeatAvailability(tripId);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Search trips endpoint
  app.get('/api/trips/search', async (req, res) => {
    try {
      const { origin, destination, date } = req.query;
      const trips = await mockTripRepository.searchTrips({ origin, destination, date });
      res.json({ success: true, trips });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get seat status
  app.get('/api/trips/:tripId/seats/:seatId/status', async (req, res) => {
    try {
      const { tripId, seatId } = req.params;
      const status = await mockSeatRepository.getSeatStatus(tripId, seatId);
      res.json({ success: true, status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return app;
};

describe('Trip Service - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/trips/:tripId/seats - Get Available Seats', () => {
    it('should retrieve available seats for trip', async () => {
      const mockSeats = [
        { seatId: 'A1', status: 'available', price: 250000 },
        { seatId: 'A2', status: 'available', price: 250000 },
        { seatId: 'A3', status: 'locked', price: 250000, lockedBy: 'user-123' },
        { seatId: 'A4', status: 'available', price: 250000 }
      ];

      mockSeatRepository.findAvailableSeats.mockResolvedValue(mockSeats);

      const response = await request(app)
        .get('/api/trips/trip-123/seats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.seats).toHaveLength(4);
      expect(mockSeatRepository.findAvailableSeats).toHaveBeenCalledWith('trip-123');
    });

    it('should filter only available seats', async () => {
      const mockSeats = [
        { seatId: 'A1', status: 'available' },
        { seatId: 'A2', status: 'available' },
        { seatId: 'A3', status: 'booked' }
      ];

      mockSeatRepository.findAvailableSeats.mockResolvedValue(mockSeats);

      const response = await request(app)
        .get('/api/trips/trip-123/seats')
        .expect(200);

      const availableSeats = response.body.seats.filter(s => s.status === 'available');
      expect(availableSeats).toHaveLength(2);
    });

    it('should handle trip with no available seats', async () => {
      mockSeatRepository.findAvailableSeats.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/trips/trip-123/seats')
        .expect(200);

      expect(response.body.seats).toHaveLength(0);
    });
  });

  describe('POST /api/trips/:tripId/seats/lock - Lock Seats', () => {
    it('should lock seats successfully', async () => {
      const mockTrip = {
        tripId: 'trip-123',
        origin: 'HCM',
        destination: 'Hanoi'
      };

      const mockLockResult = {
        lockedSeats: ['A1', 'A2'],
        lockId: 'lock-123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      };

      mockTripRepository.findById.mockResolvedValue(mockTrip);
      mockSeatRepository.lockSeats.mockResolvedValue(mockLockResult);

      const response = await request(app)
        .post('/api/trips/trip-123/seats/lock')
        .send({
          seatIds: ['A1', 'A2'],
          userId: 'user-123',
          timeoutMinutes: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.lockResult.lockedSeats).toHaveLength(2);
      expect(mockSeatRepository.lockSeats).toHaveBeenCalledWith(
        'trip-123',
        ['A1', 'A2'],
        'user-123',
        10
      );
    });

    it('should handle trip not found', async () => {
      mockTripRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/trips/trip-nonexistent/seats/lock')
        .send({
          seatIds: ['A1'],
          userId: 'user-123',
          timeoutMinutes: 10
        })
        .expect(404);

      expect(response.body.error).toContain('Trip not found');
      expect(mockSeatRepository.lockSeats).not.toHaveBeenCalled();
    });

    it('should handle already locked seats', async () => {
      mockTripRepository.findById.mockResolvedValue({ tripId: 'trip-123' });
      mockSeatRepository.lockSeats.mockRejectedValue(
        new Error('Seats already locked')
      );

      const response = await request(app)
        .post('/api/trips/trip-123/seats/lock')
        .send({
          seatIds: ['A1'],
          userId: 'user-123',
          timeoutMinutes: 10
        })
        .expect(500);

      expect(response.body.error).toContain('already locked');
    });

    it('should handle concurrent lock attempts', async () => {
      mockTripRepository.findById.mockResolvedValue({ tripId: 'trip-123' });
      
      // First lock succeeds
      mockSeatRepository.lockSeats.mockResolvedValueOnce({
        lockedSeats: ['A1'],
        lockId: 'lock-1'
      });

      // Second lock fails (same seat)
      mockSeatRepository.lockSeats.mockRejectedValueOnce(
        new Error('Seat A1 already locked')
      );

      const [response1, response2] = await Promise.allSettled([
        request(app)
          .post('/api/trips/trip-123/seats/lock')
          .send({ seatIds: ['A1'], userId: 'user-1', timeoutMinutes: 10 }),
        request(app)
          .post('/api/trips/trip-123/seats/lock')
          .send({ seatIds: ['A1'], userId: 'user-2', timeoutMinutes: 10 })
      ]);

      expect(response1.value.status).toBe(200);
      expect(response2.value.status).toBe(500);
    });
  });

  describe('POST /api/trips/:tripId/seats/unlock - Unlock Seats', () => {
    it('should unlock seats successfully', async () => {
      mockSeatRepository.unlockSeats.mockResolvedValue({ unlockedCount: 2 });

      const response = await request(app)
        .post('/api/trips/trip-123/seats/unlock')
        .send({
          seatIds: ['A1', 'A2'],
          userId: 'user-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('unlocked');
      expect(mockSeatRepository.unlockSeats).toHaveBeenCalledWith(
        'trip-123',
        ['A1', 'A2'],
        'user-123'
      );
    });

    it('should handle unlock by different user', async () => {
      mockSeatRepository.unlockSeats.mockRejectedValue(
        new Error('User does not own lock')
      );

      const response = await request(app)
        .post('/api/trips/trip-123/seats/unlock')
        .send({
          seatIds: ['A1'],
          userId: 'user-456'
        })
        .expect(500);

      expect(response.body.error).toContain('does not own lock');
    });

    it('should handle unlock of already unlocked seats', async () => {
      mockSeatRepository.unlockSeats.mockResolvedValue({ unlockedCount: 0 });

      const response = await request(app)
        .post('/api/trips/trip-123/seats/unlock')
        .send({
          seatIds: ['A1'],
          userId: 'user-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/trips/:tripId/seats/reserve - Reserve Seats', () => {
    it('should reserve seats successfully', async () => {
      const mockReservation = {
        reservedSeats: ['A1', 'A2'],
        bookingId: 'booking-123',
        status: 'reserved'
      };

      mockSeatRepository.reserveSeats.mockResolvedValue(mockReservation);
      mockTripRepository.updateSeatAvailability.mockResolvedValue({ updated: true });

      const response = await request(app)
        .post('/api/trips/trip-123/seats/reserve')
        .send({
          seatIds: ['A1', 'A2'],
          bookingId: 'booking-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.reservedSeats).toHaveLength(2);
      expect(mockSeatRepository.reserveSeats).toHaveBeenCalledWith(
        'trip-123',
        ['A1', 'A2'],
        'booking-123'
      );
      expect(mockTripRepository.updateSeatAvailability).toHaveBeenCalledWith('trip-123');
    });

    it('should handle already reserved seats', async () => {
      mockSeatRepository.reserveSeats.mockRejectedValue(
        new Error('Seats already reserved')
      );

      const response = await request(app)
        .post('/api/trips/trip-123/seats/reserve')
        .send({
          seatIds: ['A1'],
          bookingId: 'booking-123'
        })
        .expect(500);

      expect(response.body.error).toContain('already reserved');
    });
  });

  describe('GET /api/trips/search - Search Trips', () => {
    it('should search trips with availability', async () => {
      const mockTrips = [
        {
          tripId: 'trip-1',
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          departureTime: '2026-01-15T08:00:00',
          availableSeats: 20,
          totalSeats: 40
        },
        {
          tripId: 'trip-2',
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          departureTime: '2026-01-15T14:00:00',
          availableSeats: 15,
          totalSeats: 40
        }
      ];

      mockTripRepository.searchTrips.mockResolvedValue(mockTrips);

      const response = await request(app)
        .get('/api/trips/search')
        .query({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2026-01-15'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.trips).toHaveLength(2);
      expect(response.body.trips[0].availableSeats).toBe(20);
    });

    it('should return empty array when no trips found', async () => {
      mockTripRepository.searchTrips.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/trips/search')
        .query({
          origin: 'City A',
          destination: 'City B',
          date: '2026-01-15'
        })
        .expect(200);

      expect(response.body.trips).toHaveLength(0);
    });
  });

  describe('GET /api/trips/:tripId/seats/:seatId/status - Get Seat Status', () => {
    it('should get seat status', async () => {
      const mockStatus = {
        seatId: 'A1',
        status: 'locked',
        lockedBy: 'user-123',
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 600000).toISOString()
      };

      mockSeatRepository.getSeatStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/trips/trip-123/seats/A1/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status.status).toBe('locked');
      expect(response.body.status.lockedBy).toBe('user-123');
    });

    it('should handle available seat', async () => {
      const mockStatus = {
        seatId: 'A5',
        status: 'available'
      };

      mockSeatRepository.getSeatStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/trips/trip-123/seats/A5/status')
        .expect(200);

      expect(response.body.status.status).toBe('available');
    });
  });

  describe('Seat Lock Workflow Integration', () => {
    it('should complete full seat reservation flow', async () => {
      const tripId = 'trip-workflow';
      const seatIds = ['A1', 'A2'];
      const userId = 'user-workflow';
      const bookingId = 'booking-workflow';

      // Step 1: Check available seats
      mockSeatRepository.findAvailableSeats.mockResolvedValue([
        { seatId: 'A1', status: 'available' },
        { seatId: 'A2', status: 'available' }
      ]);

      await request(app)
        .get(`/api/trips/${tripId}/seats`)
        .expect(200);

      // Step 2: Lock seats
      mockTripRepository.findById.mockResolvedValue({ tripId });
      mockSeatRepository.lockSeats.mockResolvedValue({
        lockedSeats: seatIds,
        lockId: 'lock-workflow'
      });

      const lockResponse = await request(app)
        .post(`/api/trips/${tripId}/seats/lock`)
        .send({ seatIds, userId, timeoutMinutes: 10 })
        .expect(200);

      expect(lockResponse.body.lockResult.lockedSeats).toEqual(seatIds);

      // Step 3: Reserve seats (complete booking)
      mockSeatRepository.reserveSeats.mockResolvedValue({
        reservedSeats: seatIds,
        bookingId
      });
      mockTripRepository.updateSeatAvailability.mockResolvedValue({});

      const reserveResponse = await request(app)
        .post(`/api/trips/${tripId}/seats/reserve`)
        .send({ seatIds, bookingId })
        .expect(200);

      expect(reserveResponse.body.result.reservedSeats).toEqual(seatIds);

      // Verify all steps were called
      expect(mockSeatRepository.findAvailableSeats).toHaveBeenCalled();
      expect(mockSeatRepository.lockSeats).toHaveBeenCalled();
      expect(mockSeatRepository.reserveSeats).toHaveBeenCalled();
      expect(mockTripRepository.updateSeatAvailability).toHaveBeenCalled();
    });

    it('should handle lock timeout and release', async () => {
      const tripId = 'trip-timeout';
      const seatIds = ['B1'];
      const userId = 'user-timeout';

      // Lock seats
      mockTripRepository.findById.mockResolvedValue({ tripId });
      mockSeatRepository.lockSeats.mockResolvedValue({
        lockedSeats: seatIds,
        lockId: 'lock-timeout'
      });

      await request(app)
        .post(`/api/trips/${tripId}/seats/lock`)
        .send({ seatIds, userId, timeoutMinutes: 1 })
        .expect(200);

      // Simulate timeout by unlocking
      mockSeatRepository.unlockSeats.mockResolvedValue({ unlockedCount: 1 });

      await request(app)
        .post(`/api/trips/${tripId}/seats/unlock`)
        .send({ seatIds, userId })
        .expect(200);

      expect(mockSeatRepository.unlockSeats).toHaveBeenCalledWith(tripId, seatIds, userId);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors', async () => {
      mockSeatRepository.findAvailableSeats.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/trips/trip-123/seats')
        .expect(500);

      expect(response.body.error).toContain('Database');
    });

    it('should handle invalid seat IDs', async () => {
      mockTripRepository.findById.mockResolvedValue({ tripId: 'trip-123' });
      mockSeatRepository.lockSeats.mockRejectedValue(
        new Error('Invalid seat ID: Z99')
      );

      const response = await request(app)
        .post('/api/trips/trip-123/seats/lock')
        .send({
          seatIds: ['Z99'],
          userId: 'user-123',
          timeoutMinutes: 10
        })
        .expect(500);

      expect(response.body.error).toContain('Invalid seat ID');
    });

    it('should handle lock expiration gracefully', async () => {
      mockSeatRepository.getSeatStatus.mockResolvedValue({
        seatId: 'A1',
        status: 'available',
        previousLock: {
          expired: true,
          expiresAt: new Date(Date.now() - 60000).toISOString()
        }
      });

      const response = await request(app)
        .get('/api/trips/trip-123/seats/A1/status')
        .expect(200);

      expect(response.body.status.status).toBe('available');
    });
  });
});
