// chatbotHelpers.unit.test.js - Unit tests for Chatbot Helper Functions
// Tests utility functions for chatbot operations

const {
  generateSessionId,
  normalizeDate,
  normalizeCityName,
  formatTripsForChat,
  buildConversationContext
} = require('../src/utils/helpers');

describe('Chatbot Helpers - Unit Tests', () => {
  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      const id3 = generateSessionId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate IDs with consistent format', () => {
      const sessionId = generateSessionId();

      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should generate multiple unique IDs in a loop', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSessionId());
      }

      expect(ids.size).toBe(100); // All unique
    });
  });

  describe('normalizeDate', () => {
    it('should normalize "today" to current date', () => {
      const result = normalizeDate('today');
      const today = new Date();

      expect(result).toBeTruthy();
      expect(new Date(result).getDate()).toBe(today.getDate());
    });

    it('should normalize "tomorrow" to next day', () => {
      const result = normalizeDate('tomorrow');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(result).toBeTruthy();
      expect(new Date(result).getDate()).toBe(tomorrow.getDate());
    });

    it('should normalize Vietnamese "hôm nay"', () => {
      const result = normalizeDate('hôm nay');
      const today = new Date();

      expect(result).toBeTruthy();
      expect(new Date(result).getDate()).toBe(today.getDate());
    });

    it('should normalize Vietnamese "ngày mai"', () => {
      const result = normalizeDate('ngày mai');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(result).toBeTruthy();
      expect(new Date(result).getDate()).toBe(tomorrow.getDate());
    });

    it('should handle ISO date strings', () => {
      const isoDate = '2026-01-15';
      const result = normalizeDate(isoDate);

      expect(result).toBe(isoDate);
    });

    it('should handle date strings in ISO format', () => {
      const dateStr = '2026-01-20T00:00:00.000Z';
      const result = normalizeDate(dateStr);

      expect(result).toContain('2026-01-20');
    });

    it('should return original string for invalid dates', () => {
      const result = normalizeDate('invalid date');

      expect(result).toBe('invalid date');
    });
  });

  describe('normalizeCityName', () => {
    it('should normalize Ho Chi Minh City variations', () => {
      expect(normalizeCityName('Ho Chi Minh City')).toBe('Ho Chi Minh City');
      expect(normalizeCityName('HCM')).toBe('Ho Chi Minh City');
      expect(normalizeCityName('Saigon')).toBe('Ho Chi Minh City');
      expect(normalizeCityName('ho chi minh')).toBe('Ho Chi Minh City');
      expect(normalizeCityName('sai gon')).toBe('Ho Chi Minh City');
    });

    it('should normalize Hanoi variations', () => {
      expect(normalizeCityName('Hanoi')).toBe('Hanoi');
      expect(normalizeCityName('Ha Noi')).toBe('Hanoi');
      expect(normalizeCityName('hà nội')).toBe('Hanoi');
    });

    it('should normalize Da Nang variations', () => {
      expect(normalizeCityName('Da Nang')).toBe('Da Nang');
      expect(normalizeCityName('Danang')).toBe('Da Nang');
      expect(normalizeCityName('đà nẵng')).toBe('Da Nang');
    });

    it('should be case-insensitive', () => {
      const result1 = normalizeCityName('HANOI');
      const result2 = normalizeCityName('hanoi');
      const result3 = normalizeCityName('Hanoi');

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should handle cities not in mapping', () => {
      const result = normalizeCityName('Unknown City');

      expect(result).toBe('Unknown City');
    });

    it('should trim whitespace', () => {
      const result = normalizeCityName('  Hanoi  ');

      expect(result).toBeTruthy();
      expect(result).not.toContain('  ');
    });
  });

  describe('formatTripsForChat', () => {
    it('should format single trip correctly', () => {
      const trips = [
        {
          trip_id: 'trip-1',
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          departure_time: '2026-01-15T08:00:00.000Z',
          arrival_time: '2026-01-16T06:00:00.000Z',
          base_price: 500000,
          available_seats: 20,
          operator_name: 'Viet Express'
        }
      ];

      const result = formatTripsForChat(trips, 5);

      expect(result).toHaveLength(1);
      expect(result[0].tripId).toBe('trip-1');
      expect(result[0].departureTime).toBeTruthy();
      expect(result[0].price).toBe(500000);
      expect(result[0].availableSeats).toBe(20);
    });

    it('should format multiple trips', () => {
      const trips = [
        {
          trip_id: 'trip-1',
          origin: 'HCM',
          destination: 'Hanoi',
          departure_time: '2026-01-15T08:00:00.000Z',
          base_price: 500000,
          available_seats: 20
        },
        {
          trip_id: 'trip-2',
          origin: 'HCM',
          destination: 'Hanoi',
          departure_time: '2026-01-15T14:00:00.000Z',
          base_price: 450000,
          available_seats: 15
        }
      ];

      const result = formatTripsForChat(trips, 5);

      expect(result).toHaveLength(2);
      expect(result[0].tripId).toBe('trip-1');
      expect(result[1].tripId).toBe('trip-2');
      expect(result[0].departureTime).toBeTruthy();
      expect(result[1].departureTime).toBeTruthy();
    });

    it('should handle Vietnamese language', () => {
      const trips = [
        {
          trip_id: 'trip-1',
          origin: 'TP.HCM',
          destination: 'Hà Nội',
          departure_time: '2026-01-15T08:00:00.000Z',
          base_price: 500000,
          available_seats: 10
        }
      ];

      const result = formatTripsForChat(trips, 5);

      expect(result).toHaveLength(1);
      expect(result[0].tripId).toBe('trip-1');
    });

    it('should handle empty trips array', () => {
      const result = formatTripsForChat([], 'en');

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should highlight trips with low seat availability', () => {
      const trips = [
        {
          trip_id: 'trip-1',
          origin: 'HCM',
          destination: 'Hanoi',
          departure_time: '2026-01-15T08:00:00.000Z',
          base_price: 500000,
          available_seats: 3 // Low availability
        }
      ];

      const result = formatTripsForChat(trips, 5);

      expect(result).toHaveLength(1);
      expect(result[0].availableSeats).toBe(3);
    });

    it('should format prices correctly', () => {
      const trips = [
        {
          trip_id: 'trip-1',
          origin: 'HCM',
          destination: 'Hanoi',
          departure_time: '2026-01-15T08:00:00.000Z',
          base_price: 1000000,
          available_seats: 10
        }
      ];

      const result = formatTripsForChat(trips, 5);

      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(1000000);
    });
  });

  describe('buildConversationContext', () => {
    it('should build context from conversation history', () => {
      const conversationHistory = [
        {
          role: 'user',
          content: 'I want to book a ticket from HCM to Hanoi',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: 'I found several trips for you',
          timestamp: new Date()
        }
      ];

      const result = buildConversationContext(conversationHistory);

      expect(result).toBeTruthy();
      expect(result[0].content).toContain('HCM to Hanoi');
    });

    it('should handle empty conversation history', () => {
      const result = buildConversationContext([]);

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should limit context to recent messages', () => {
      const manyMessages = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date()
      }));

      const result = buildConversationContext(manyMessages);

      expect(result).toBeTruthy();
      // Should not include all 50 messages
      expect(result.length).toBeLessThan(50);
    });

    it('should preserve message order', () => {
      const history = [
        { role: 'user', content: 'First message', timestamp: new Date() },
        { role: 'assistant', content: 'Second message', timestamp: new Date() },
        { role: 'user', content: 'Third message', timestamp: new Date() }
      ];

      const result = buildConversationContext(history);

      expect(result[0].content).toContain('First');
      expect(result[1].content).toContain('Second');
      expect(result[2].content).toContain('Third');
    });

    it('should handle messages with special characters', () => {
      const history = [
        {
          role: 'user',
          content: 'How much is a ticket? $100?',
          timestamp: new Date()
        }
      ];

      const result = buildConversationContext(history);

      expect(result[0].content).toContain('$100');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null inputs gracefully', () => {
      expect(() => normalizeDate(null)).not.toThrow();
      expect(() => normalizeCityName(null)).not.toThrow();
      expect(() => formatTripsForChat(null, 'en')).not.toThrow();
      expect(() => buildConversationContext(null)).not.toThrow();
    });

    it('should handle undefined inputs', () => {
      expect(() => normalizeDate(undefined)).not.toThrow();
      expect(() => normalizeCityName(undefined)).not.toThrow();
      expect(() => formatTripsForChat(undefined, 'en')).not.toThrow();
    });

    it('should handle malformed trip data', () => {
      const malformedTrips = [
        { tripId: 'trip-1' }, // Missing required fields
        { origin: 'HCM' }, // Missing tripId
        {} // Empty object
      ];

      expect(() => formatTripsForChat(malformedTrips, 'en')).not.toThrow();
    });

    it('should handle very long city names', () => {
      const longCityName = 'A'.repeat(1000);
      const result = normalizeCityName(longCityName);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle dates in various formats', () => {
      const dateFormats = [
        '2026-01-15',
        '01/15/2026',
        'January 15, 2026',
        '15 Jan 2026'
      ];

      dateFormats.forEach(format => {
        expect(() => normalizeDate(format)).not.toThrow();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large conversation histories efficiently', () => {
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        message: `Message ${i}`,
        timestamp: new Date()
      }));

      const startTime = Date.now();
      buildConversationContext(largeHistory);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle many trips efficiently', () => {
      const manyTrips = Array.from({ length: 100 }, (_, i) => ({
        tripId: `trip-${i}`,
        origin: 'HCM',
        destination: 'Hanoi',
        departureTime: '08:00',
        price: 500000,
        availableSeats: 20
      }));

      const startTime = Date.now();
      formatTripsForChat(manyTrips, 'en');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
