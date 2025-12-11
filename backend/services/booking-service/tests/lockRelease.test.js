// tests/lockRelease.test.js
const bookingService = require('../src/services/bookingService');
const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('Booking Service - Lock Release for Cancelled Bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('releaseLocksForCancelledBooking', () => {
    const tripId = 'test-trip-123';
    const seatCodes = ['A1', 'A2'];

    test('should release locks for authenticated users using sessionId', async () => {
      const userId = 'user-123';

      // Mock successful response for authenticated user
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: { released_seats: seatCodes } },
      });

      const result = await bookingService.releaseLocksForCancelledBooking(
        tripId,
        seatCodes,
        userId
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `http://localhost:3002/${tripId}/seats/release`,
        {
          seatCodes,
          sessionId: userId,
          isGuest: false,
        },
        expect.any(Object)
      );

      expect(result).toEqual({ released_seats: seatCodes });
    });

    test('should use service call directly for guests (no authenticated attempt)', async () => {
      const userId = null; // Guest user

      // Mock successful service call
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: { released_seats: seatCodes } },
      });

      const result = await bookingService.releaseLocksForCancelledBooking(
        tripId,
        seatCodes,
        userId
      );

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `http://localhost:3002/${tripId}/seats/release`,
        {
          seatCodes,
          isGuest: true,
        },
        expect.any(Object)
      );

      expect(result).toEqual({ released_seats: seatCodes });
    });

    test('should handle service call failure gracefully', async () => {
      const userId = null; // Guest user

      // Mock service call failure
      mockedAxios.post.mockRejectedValueOnce(new Error('Service call failed'));

      // Should not throw, just log error and return undefined
      const result = await bookingService.releaseLocksForCancelledBooking(
        tripId,
        seatCodes,
        userId
      );

      expect(result).toBeUndefined();
    });
  });
});
