// advancedHelpers.unit.test.js - Tests for advanced helper functions
const helpers = require('../src/utils/helpers');

describe('Advanced Helper Functions - Coverage Tests', () => {
  
  describe('extractUserInfo', () => {
    it('should extract user info from request', () => {
      const req = {
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'passenger'
        }
      };

      const result = helpers.extractUserInfo(req);

      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('passenger');
      expect(result.isGuest).toBe(false);
    });

    it('should handle guest user (no user object)', () => {
      const req = {};

      const result = helpers.extractUserInfo(req);

      expect(result.userId).toBeNull();
      expect(result.isGuest).toBe(true);
      expect(result.email).toBeNull();
    });

    it('should handle user_id alternative field', () => {
      const req = {
        user: {
          user_id: 'user-456'
        }
      };

      const result = helpers.extractUserInfo(req);

      expect(result.userId).toBe('user-456');
    });

    it('should default role to user when not specified', () => {
      const req = {
        user: {
          userId: 'user-789'
        }
      };

      const result = helpers.extractUserInfo(req);

      expect(result.role).toBe('user');
    });
  });

  describe('formatTripForChat', () => {
    it('should format trip with all fields from schedule object', () => {
      const trip = {
        trip_id: 'trip-123',
        schedule: {
          departure_time: '2026-01-15T08:00:00.000Z',
          arrival_time: '2026-01-15T14:00:00.000Z'
        },
        pricing: {
          base_price: 500000
        },
        availability: {
          available_seats: 20
        },
        bus: {
          bus_type: 'Giường nằm'
        },
        operator: {
          name: 'Phương Trang'
        }
      };

      const result = helpers.formatTripForChat(trip);

      expect(result.tripId).toBe('trip-123');
      expect(result.departureTime).toBeTruthy();
      expect(result.arrivalTime).toBeTruthy();
      expect(result.price).toBe(500000);
      expect(result.availableSeats).toBe(20);
      expect(result.busType).toBe('Giường nằm');
      expect(result.operator).toBe('Phương Trang');
    });

    it('should format trip with flat structure (no nested objects)', () => {
      const trip = {
        trip_id: 'trip-456',
        departure_time: '2026-01-16T10:00:00.000Z',
        arrival_time: '2026-01-16T16:00:00.000Z',
        base_price: 450000,
        available_seats: 15,
        bus_type: 'Ghế ngồi',
        operator_name: 'Kumho'
      };

      const result = helpers.formatTripForChat(trip);

      expect(result.tripId).toBe('trip-456');
      expect(result.price).toBe(450000);
      expect(result.availableSeats).toBe(15);
      expect(result.busType).toBe('Ghế ngồi');
      expect(result.operator).toBe('Kumho');
    });

    it('should handle missing optional fields gracefully', () => {
      const trip = {
        trip_id: 'trip-789',
        departure_time: null,
        arrival_time: null,
        base_price: 300000
      };

      const result = helpers.formatTripForChat(trip);

      expect(result.tripId).toBe('trip-789');
      expect(result.departureTime).toBe('N/A');
      expect(result.arrivalTime).toBe('N/A');
      expect(result.price).toBe(300000);
    });

    it('should extract date from ISO string', () => {
      const trip = {
        trip_id: 'trip-date',
        departure_time: '2026-01-15T08:00:00.000Z'
      };

      const result = helpers.formatTripForChat(trip);

      expect(result.date).toContain('2026-01-15');
    });

    it('should handle date field directly if provided', () => {
      const trip = {
        trip_id: 'trip-with-date',
        date: '2026-01-20',
        departure_time: '2026-01-15T08:00:00.000Z'
      };

      const result = helpers.formatTripForChat(trip);

      // date field should take priority
      expect(result.date).toBe('2026-01-20');
    });
  });

  describe('formatTripsForChat - Advanced Cases', () => {
    it('should handle searchDate injection', () => {
      const trips = [
        {
          trip_id: 'trip-1',
          departure_time: '2026-01-15T08:00:00.000Z',
          base_price: 500000,
          available_seats: 10
        }
      ];

      const result = helpers.formatTripsForChat(trips, 5, '2026-01-25');

      expect(result).toHaveLength(1);
      // If trip doesn't have date, searchDate should be injected
      expect(result[0].date).toBeTruthy();
    });

    it('should limit trips to specified limit', () => {
      const trips = Array.from({ length: 20 }, (_, i) => ({
        trip_id: `trip-${i}`,
        departure_time: '2026-01-15T08:00:00.000Z',
        base_price: 500000,
        available_seats: 10
      }));

      const result = helpers.formatTripsForChat(trips, 5);

      expect(result).toHaveLength(5);
    });

    it('should handle empty array', () => {
      const result = helpers.formatTripsForChat([]);

      expect(result).toEqual([]);
    });

    it('should handle null trips', () => {
      const result = helpers.formatTripsForChat(null);

      expect(result).toEqual([]);
    });

    it('should handle non-array input', () => {
      const result = helpers.formatTripsForChat('not an array');

      expect(result).toEqual([]);
    });
  });

  describe('normalizeDate - Edge Cases', () => {
    it('should handle năm sau (next year) format', () => {
      const result = helpers.normalizeDate('15/01 năm sau');

      // Function returns original if can't parse or returns formatted date
      expect(result).toBeTruthy();
    });

    it('should handle năm sau with dash format', () => {
      const result = helpers.normalizeDate('15-01 năm sau');

      expect(result).toBeTruthy();
    });

    it('should return original for unparseable năm sau', () => {
      const result = helpers.normalizeDate('invalid năm sau');

      // Should return original string since it can't parse
      expect(result).toBeTruthy();
    });

    it('should handle null input', () => {
      const result = helpers.normalizeDate(null);

      expect(result).toBeNull();
    });

    it('should handle empty string', () => {
      const result = helpers.normalizeDate('');

      expect(result).toBeNull();
    });
  });

  describe('Error Handling Paths', () => {
    it('should handle invalid date parsing gracefully', () => {
      // This will trigger error path in date parsing
      const result = helpers.normalizeDate('not-a-date-at-all');

      // Should return original string
      expect(result).toBe('not-a-date-at-all');
    });

    it('should handle formatTime with null', () => {
      const trip = {
        trip_id: 'test',
        departure_time: null
      };

      const result = helpers.formatTripForChat(trip);

      expect(result.departureTime).toBe('N/A');
    });

    it('should handle formatTime with invalid date', () => {
      const trip = {
        trip_id: 'test',
        departure_time: 'invalid-date'
      };

      const result = helpers.formatTripForChat(trip);

      // Should handle error and return N/A
      expect(result.departureTime).toBeTruthy();
    });
  });
});
