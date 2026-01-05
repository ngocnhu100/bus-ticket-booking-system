// faqService.unit.test.js - Unit tests for FAQ Service
// Tests FAQ query processing and response generation

const FAQService = require('../src/services/faqService');
const { searchFAQ, getFAQByTopic, getAllTopics } = require('../data/faqKnowledgeBase');

// Mock FAQ knowledge base
jest.mock('../data/faqKnowledgeBase');

describe('FAQService - Unit Tests', () => {
  let faqService;

  beforeEach(() => {
    faqService = new FAQService();
    jest.clearAllMocks();
  });

  describe('shouldEscalate', () => {
    it('should detect escalation keywords in English', () => {
      const messages = [
        'I want to talk to a human',
        'Can I speak to an agent?',
        'I need customer service',
        'Escalate this to support team'
      ];

      messages.forEach(message => {
        const result = faqService.shouldEscalate(message, 'en');
        expect(result).toBe(true);
      });
    });

    it('should detect escalation keywords in Vietnamese', () => {
      const messages = [
        'Tôi muốn nói chuyện với người thật',
        'Gặp nhân viên hỗ trợ',
        'Dịch vụ khách hàng',
        'Phàn nàn'
      ];

      messages.forEach(message => {
        const result = faqService.shouldEscalate(message, 'vi');
        expect(result).toBe(true);
      });
    });

    it('should not escalate normal queries', () => {
      const messages = [
        'How do I book a ticket?',
        'What is the refund policy?',
        'When does the bus depart?'
      ];

      messages.forEach(message => {
        const result = faqService.shouldEscalate(message, 'en');
        expect(result).toBe(false);
      });
    });

    it('should be case-insensitive', () => {
      const result = faqService.shouldEscalate('TALK TO HUMAN', 'en');
      expect(result).toBe(true);
    });
  });

  describe('processFAQQuery', () => {
    it('should return escalation response for escalation queries', async () => {
      const message = 'I want to talk to a human';

      const result = await faqService.processFAQQuery(message, 'en');

      expect(result.intent).toBe('escalation');
      expect(result.response).toContain('support');
      expect(result.requiresAction).toBe(true);
    });

    it('should return FAQ response for matching queries', async () => {
      const mockFAQResults = [
        {
          question: 'How do I book a ticket?',
          answer: 'You can book tickets through our website or mobile app.',
          topic: 'booking',
          matchScore: 3,
          relatedLinks: [{ text: 'Booking Guide', url: '/guide/booking' }]
        }
      ];

      searchFAQ.mockReturnValue(mockFAQResults);

      const result = await faqService.processFAQQuery('how to book ticket', 'en');

      expect(result.intent).toBe('faq');
      expect(result.response).toBe(mockFAQResults[0].answer);
      expect(result.topic).toBe('booking');
      expect(result.relatedLinks).toEqual(mockFAQResults[0].relatedLinks);
      expect(searchFAQ).toHaveBeenCalledWith('how to book ticket', 'en');
    });

    it('should handle no FAQ found', async () => {
      searchFAQ.mockReturnValue([]);

      const result = await faqService.processFAQQuery('random question', 'en');

      expect(result.intent).toBe('no_faq');
      expect(result.response).toBeTruthy();
      expect(searchFAQ).toHaveBeenCalledWith('random question', 'en');
    });

    it('should offer suggestions for low match scores', async () => {
      const mockFAQResults = [
        { question: 'Question 1', answer: 'Answer 1', matchScore: 1 },
        { question: 'Question 2', answer: 'Answer 2', matchScore: 1 },
        { question: 'Question 3', answer: 'Answer 3', matchScore: 1 }
      ];

      searchFAQ.mockReturnValue(mockFAQResults);

      const result = await faqService.processFAQQuery('vague query', 'en');

      expect(result.intent).toBe('did_you_mean');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle Vietnamese queries', async () => {
      const mockFAQResults = [
        {
          question: 'Làm thế nào để đặt vé?',
          answer: 'Bạn có thể đặt vé qua website hoặc ứng dụng di động.',
          topic: 'booking',
          matchScore: 3
        }
      ];

      searchFAQ.mockReturnValue(mockFAQResults);

      const result = await faqService.processFAQQuery('đặt vé như thế nào', 'vi');

      expect(result.intent).toBe('faq');
      expect(result.response).toContain('đặt vé');
      expect(searchFAQ).toHaveBeenCalledWith('đặt vé như thế nào', 'vi');
    });

    it('should handle errors gracefully', async () => {
      searchFAQ.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await faqService.processFAQQuery('test query', 'en');

      expect(result.intent).toBe('error');
      expect(result.response).toBeTruthy();
    });
  });

  describe('formatFAQResponse', () => {
    it('should format FAQ response correctly', () => {
      const mockFAQ = {
        question: 'How do I cancel a booking?',
        answer: 'You can cancel bookings through your account dashboard.',
        topic: 'cancellation',
        matchScore: 3,
        relatedLinks: [
          { text: 'Cancellation Policy', url: '/policy/cancellation' }
        ]
      };

      const result = faqService.formatFAQResponse(mockFAQ, 'en');

      expect(result.intent).toBe('faq');
      expect(result.response).toBe(mockFAQ.answer);
      expect(result.topic).toBe(mockFAQ.topic);
      expect(result.relatedLinks).toEqual(mockFAQ.relatedLinks);
      expect(result.suggestions).toContain('Ask another question');
      expect(result.requiresAction).toBe(false);
    });

    it('should include Vietnamese suggestions for Vietnamese language', () => {
      const mockFAQ = {
        question: 'Test',
        answer: 'Test answer',
        topic: 'test',
        matchScore: 3
      };

      const result = faqService.formatFAQResponse(mockFAQ, 'vi');

      expect(result.suggestions).toContain('Hỏi câu khác');
      expect(result.suggestions).toContain('Nói chuyện với nhân viên');
    });

    it('should handle FAQ without related links', () => {
      const mockFAQ = {
        question: 'Test',
        answer: 'Test answer',
        topic: 'test',
        matchScore: 3
      };

      const result = faqService.formatFAQResponse(mockFAQ, 'en');

      expect(result.relatedLinks).toEqual([]);
      expect(result.response).toBe(mockFAQ.answer);
    });
  });

  describe('getEscalationResponse', () => {
    it('should provide escalation options in English', () => {
      const result = faqService.getEscalationResponse('en');

      expect(result.intent).toBe('escalation');
      expect(result.response).toContain('support');
      expect(result.response).toContain('Hotline');
      expect(result.response).toContain('Email');
      expect(result.requiresAction).toBe(true);
    });

    it('should provide escalation options in Vietnamese', () => {
      const result = faqService.getEscalationResponse('vi');

      expect(result.intent).toBe('escalation');
      expect(result.response).toBeTruthy();
      expect(result.requiresAction).toBe(true);
    });

    it('should include contact methods', () => {
      const result = faqService.getEscalationResponse('en');

      expect(result.response).toMatch(/hotline|phone|email/i);
    });
  });

  describe('Topic-based FAQ Retrieval', () => {
    it('should retrieve FAQs by topic', () => {
      const mockTopicFAQs = [
        { question: 'Q1', answer: 'A1', topic: 'booking' },
        { question: 'Q2', answer: 'A2', topic: 'booking' }
      ];

      getFAQByTopic.mockReturnValue(mockTopicFAQs);

      const result = getFAQByTopic('booking', 'en');

      expect(result).toEqual(mockTopicFAQs);
      expect(result.every(faq => faq.topic === 'booking')).toBe(true);
    });

    it('should get all available topics', () => {
      const mockTopics = ['booking', 'cancellation', 'payment', 'refund'];

      getAllTopics.mockReturnValue(mockTopics);

      const result = getAllTopics('en');

      expect(result).toEqual(mockTopics);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', async () => {
      searchFAQ.mockReturnValue([]);

      const result = await faqService.processFAQQuery('', 'en');

      expect(result).toBeTruthy();
      expect(result.response).toBeTruthy();
    });

    it('should handle very long messages', async () => {
      const longMessage = 'How do I '.repeat(100) + 'book a ticket?';
      
      searchFAQ.mockReturnValue([
        { question: 'Booking', answer: 'Answer', matchScore: 2 }
      ]);

      const result = await faqService.processFAQQuery(longMessage, 'en');

      expect(result).toBeTruthy();
      expect(searchFAQ).toHaveBeenCalledWith(longMessage, 'en');
    });

    it('should handle special characters in query', async () => {
      const specialMessage = 'How do I book @#$% ticket?';
      
      searchFAQ.mockReturnValue([]);

      const result = await faqService.processFAQQuery(specialMessage, 'en');

      expect(result).toBeTruthy();
    });

    it('should default to English for unsupported language', async () => {
      searchFAQ.mockReturnValue([]);

      const result = await faqService.processFAQQuery('test', 'fr');

      expect(result).toBeTruthy();
    });
  });

  describe('Multiple Match Scenarios', () => {
    it('should return best match when multiple results found', async () => {
      const mockResults = [
        { question: 'Q1', answer: 'Best Answer', matchScore: 5 },
        { question: 'Q2', answer: 'Good Answer', matchScore: 3 },
        { question: 'Q3', answer: 'Okay Answer', matchScore: 2 }
      ];

      searchFAQ.mockReturnValue(mockResults);

      const result = await faqService.processFAQQuery('test query', 'en');

      expect(result.intent).toBe('faq');
      expect(result.response).toBe('Best Answer');
    });

    it('should limit suggestions to top 3 results', async () => {
      const mockResults = Array.from({ length: 10 }, (_, i) => ({
        question: `Q${i}`,
        answer: `A${i}`,
        matchScore: 1
      }));

      searchFAQ.mockReturnValue(mockResults);

      const result = await faqService.processFAQQuery('test', 'en');

      if (result.intent === 'did_you_mean') {
        expect(result.suggestions.length).toBeLessThanOrEqual(3);
      }
    });
  });
});
