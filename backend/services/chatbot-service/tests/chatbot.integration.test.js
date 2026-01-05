// chatbot.integration.test.js - Integration tests for Chatbot Service
// Tests chatbot conversation flows and service integration

const request = require('supertest');
const express = require('express');
const chatbotService = require('../src/services/chatbotService');
const faqService = require('../src/services/faqService');
const tripServiceClient = require('../src/services/tripServiceClient');

// Mock dependencies
jest.mock('../src/services/chatbotService');
jest.mock('../src/services/faqService');
jest.mock('../src/services/tripServiceClient');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Chatbot routes
  app.post('/api/chatbot/message', async (req, res) => {
    try {
      const { message, sessionId, language } = req.body;
      const response = await chatbotService.processMessage(message, sessionId, language);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chatbot/search-trips', async (req, res) => {
    try {
      const { origin, destination, date } = req.body;
      const trips = await tripServiceClient.searchTrips({ origin, destination, date });
      res.json({ success: true, trips });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chatbot/faq', async (req, res) => {
    try {
      const { query, language } = req.body;
      const response = await faqService.processFAQQuery(query, language);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return app;
};

describe('Chatbot Service - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/chatbot/message - Process Chatbot Message', () => {
    it('should process greeting message', async () => {
      const mockResponse = {
        intent: 'greeting',
        response: 'Hello! How can I help you today?',
        suggestions: ['Search trips', 'Check booking', 'FAQ']
      };

      chatbotService.processMessage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello',
          sessionId: 'session-123',
          language: 'en'
        })
        .expect(200);

      expect(response.body.intent).toBe('greeting');
      expect(response.body.response).toBeTruthy();
      expect(response.body.suggestions).toBeDefined();
    });

    it('should process trip search request', async () => {
      const mockResponse = {
        intent: 'search_trip',
        response: 'I found 5 trips from Ho Chi Minh City to Hanoi',
        trips: [
          {
            tripId: 'trip-1',
            origin: 'Ho Chi Minh City',
            destination: 'Hanoi',
            departureTime: '08:00',
            price: 500000,
            availableSeats: 20
          }
        ],
        suggestions: ['Book trip #1', 'Filter by price', 'Change date']
      };

      chatbotService.processMessage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'I want to go from HCM to Hanoi tomorrow',
          sessionId: 'session-123',
          language: 'en'
        })
        .expect(200);

      expect(response.body.intent).toBe('search_trip');
      expect(response.body.trips).toBeDefined();
      expect(response.body.trips.length).toBeGreaterThan(0);
    });

    it('should process booking request', async () => {
      const mockResponse = {
        intent: 'book_trip',
        response: 'Please select your seats for the trip',
        requiresAction: true,
        actionType: 'seat_selection',
        tripId: 'trip-1'
      };

      chatbotService.processMessage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'I want to book trip #1',
          sessionId: 'session-123',
          language: 'en'
        })
        .expect(200);

      expect(response.body.intent).toBe('book_trip');
      expect(response.body.requiresAction).toBe(true);
      expect(response.body.tripId).toBeTruthy();
    });

    it('should handle Vietnamese language', async () => {
      const mockResponse = {
        intent: 'greeting',
        response: 'Xin chào! Tôi có thể giúp gì cho bạn?',
        suggestions: ['Tìm chuyến', 'Kiểm tra đặt chỗ', 'Câu hỏi thường gặp']
      };

      chatbotService.processMessage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Xin chào',
          sessionId: 'session-123',
          language: 'vi'
        })
        .expect(200);

      expect(response.body.response).toContain('chào');
    });

    it('should maintain session context', async () => {
      const sessionId = 'session-456';
      
      // First message
      chatbotService.processMessage.mockResolvedValueOnce({
        intent: 'search_trip',
        response: 'Where would you like to go?'
      });

      await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'I want to book a ticket',
          sessionId,
          language: 'en'
        })
        .expect(200);

      // Second message should use context
      chatbotService.processMessage.mockResolvedValueOnce({
        intent: 'search_trip',
        response: 'Searching trips from HCM to Hanoi'
      });

      const response2 = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'From HCM to Hanoi',
          sessionId,
          language: 'en'
        })
        .expect(200);

      expect(chatbotService.processMessage).toHaveBeenCalledTimes(2);
      expect(chatbotService.processMessage.mock.calls[1][1]).toBe(sessionId);
    });

    it('should handle errors gracefully', async () => {
      chatbotService.processMessage.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello',
          sessionId: 'session-123',
          language: 'en'
        })
        .expect(500);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('POST /api/chatbot/search-trips - Trip Search Integration', () => {
    it('should search trips successfully', async () => {
      const mockTrips = [
        {
          tripId: 'trip-1',
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          departureTime: '2026-01-15T08:00:00',
          price: 500000,
          availableSeats: 20
        },
        {
          tripId: 'trip-2',
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          departureTime: '2026-01-15T14:00:00',
          price: 450000,
          availableSeats: 15
        }
      ];

      tripServiceClient.searchTrips.mockResolvedValue(mockTrips);

      const response = await request(app)
        .post('/api/chatbot/search-trips')
        .send({
          origin: 'Ho Chi Minh City',
          destination: 'Hanoi',
          date: '2026-01-15'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.trips).toHaveLength(2);
      expect(response.body.trips[0].tripId).toBe('trip-1');
    });

    it('should handle no trips found', async () => {
      tripServiceClient.searchTrips.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/chatbot/search-trips')
        .send({
          origin: 'Ho Chi Minh City',
          destination: 'Can Tho',
          date: '2026-01-15'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.trips).toHaveLength(0);
    });

    it('should handle trip service errors', async () => {
      tripServiceClient.searchTrips.mockRejectedValue(
        new Error('Trip service unavailable')
      );

      const response = await request(app)
        .post('/api/chatbot/search-trips')
        .send({
          origin: 'HCM',
          destination: 'Hanoi',
          date: '2026-01-15'
        })
        .expect(500);

      expect(response.body.error).toContain('Trip service unavailable');
    });
  });

  describe('POST /api/chatbot/faq - FAQ Integration', () => {
    it('should process FAQ query successfully', async () => {
      const mockFAQResponse = {
        intent: 'faq',
        response: 'You can cancel bookings up to 24 hours before departure.',
        topic: 'cancellation',
        suggestions: ['Refund policy', 'How to cancel', 'Ask another question']
      };

      faqService.processFAQQuery.mockResolvedValue(mockFAQResponse);

      const response = await request(app)
        .post('/api/chatbot/faq')
        .send({
          query: 'How do I cancel my booking?',
          language: 'en'
        })
        .expect(200);

      expect(response.body.intent).toBe('faq');
      expect(response.body.response).toBeTruthy();
      expect(response.body.topic).toBe('cancellation');
    });

    it('should handle escalation to human support', async () => {
      const mockEscalationResponse = {
        intent: 'escalation',
        response: 'I will connect you with a support agent.',
        requiresAction: true,
        suggestions: ['Call hotline', 'Email support']
      };

      faqService.processFAQQuery.mockResolvedValue(mockEscalationResponse);

      const response = await request(app)
        .post('/api/chatbot/faq')
        .send({
          query: 'I want to talk to a human',
          language: 'en'
        })
        .expect(200);

      expect(response.body.intent).toBe('escalation');
      expect(response.body.requiresAction).toBe(true);
    });

    it('should handle FAQ not found', async () => {
      const mockResponse = {
        intent: 'no_faq',
        response: 'I could not find an answer. Would you like to talk to support?',
        suggestions: ['Talk to support', 'Try different question']
      };

      faqService.processFAQQuery.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chatbot/faq')
        .send({
          query: 'Very specific question that has no answer',
          language: 'en'
        })
        .expect(200);

      expect(response.body.intent).toBe('no_faq');
    });
  });

  describe('Chatbot Conversation Workflows', () => {
    it('should complete full booking conversation flow', async () => {
      const sessionId = 'session-workflow-1';

      // Step 1: Greeting
      chatbotService.processMessage.mockResolvedValueOnce({
        intent: 'greeting',
        response: 'Hello! How can I help you?'
      });

      await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'Hi', sessionId, language: 'en' })
        .expect(200);

      // Step 2: Search request
      chatbotService.processMessage.mockResolvedValueOnce({
        intent: 'search_trip',
        response: 'I found trips for you',
        trips: [{ tripId: 'trip-1', price: 500000 }]
      });

      await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'I want to go to Hanoi', sessionId, language: 'en' })
        .expect(200);

      // Step 3: Booking
      chatbotService.processMessage.mockResolvedValueOnce({
        intent: 'book_trip',
        response: 'Please select seats',
        requiresAction: true
      });

      const bookResponse = await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'Book trip #1', sessionId, language: 'en' })
        .expect(200);

      expect(bookResponse.body.requiresAction).toBe(true);
      expect(chatbotService.processMessage).toHaveBeenCalledTimes(3);
    });

    it('should handle FAQ then trip search flow', async () => {
      const sessionId = 'session-workflow-2';

      // Step 1: FAQ
      faqService.processFAQQuery.mockResolvedValueOnce({
        intent: 'faq',
        response: 'Cancellation policy explained'
      });

      await request(app)
        .post('/api/chatbot/faq')
        .send({ query: 'What is the cancellation policy?', language: 'en' })
        .expect(200);

      // Step 2: Switch to trip search
      chatbotService.processMessage.mockResolvedValueOnce({
        intent: 'search_trip',
        response: 'Searching trips...'
      });

      await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'Now I want to search for trips', sessionId, language: 'en' })
        .expect(200);

      expect(faqService.processFAQQuery).toHaveBeenCalled();
      expect(chatbotService.processMessage).toHaveBeenCalled();
    });
  });

  describe('Multi-Language Support', () => {
    it('should handle English conversations', async () => {
      chatbotService.processMessage.mockResolvedValue({
        intent: 'greeting',
        response: 'Hello! How can I help?',
        language: 'en'
      });

      const response = await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'Hello', sessionId: 'test', language: 'en' })
        .expect(200);

      expect(response.body.response).toContain('Hello');
    });

    it('should handle Vietnamese conversations', async () => {
      chatbotService.processMessage.mockResolvedValue({
        intent: 'greeting',
        response: 'Xin chào! Tôi có thể giúp gì?',
        language: 'vi'
      });

      const response = await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'Xin chào', sessionId: 'test', language: 'vi' })
        .expect(200);

      expect(response.body.response).toContain('chào');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network timeouts', async () => {
      tripServiceClient.searchTrips.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const response = await request(app)
        .post('/api/chatbot/search-trips')
        .send({ origin: 'HCM', destination: 'Hanoi', date: '2026-01-15' })
        .expect(500);

      expect(response.body.error).toContain('Timeout');
    });

    it('should handle malformed requests', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({ invalidField: 'test' })
        .expect(500);

      expect(response.body.error).toBeTruthy();
    });

    it('should handle concurrent requests', async () => {
      chatbotService.processMessage.mockResolvedValue({
        intent: 'greeting',
        response: 'Hello!'
      });

      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/chatbot/message')
          .send({
            message: 'Hello',
            sessionId: `session-${i}`,
            language: 'en'
          })
      );

      const responses = await Promise.all(requests);

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(chatbotService.processMessage).toHaveBeenCalledTimes(5);
    });
  });
});
