const chatbotService = require('../services/chatbotService');
const {
  chatQuerySchema,
  chatBookingSchema,
  sessionIdSchema,
  feedbackSchema,
  passengerInfoFormSchema,
} = require('../validators/chatValidators');
const { extractUserInfo } = require('../utils/helpers');

class ChatbotController {
  /**
   * Health check
   * GET /health
   */
  async healthCheck(req, res) {
    res.json({
      success: true,
      service: 'chatbot-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Process user query
   * POST /chatbot/query
   */
  async query(req, res) {
    try {
      // Validate request
      const { error, value } = chatQuerySchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { sessionId, message, context, actionData } = value;
      const userInfo = extractUserInfo(req);

      // Extract token from Authorization header (remove "Bearer " prefix)
      let authToken = req.headers.authorization;
      if (authToken && authToken.startsWith('Bearer ')) {
        authToken = authToken.substring(7); // Remove "Bearer " prefix
      }

      // Process the query
      const result = await chatbotService.processQuery(
        sessionId,
        message,
        userInfo.userId,
        authToken,
        actionData
      );

      return res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ChatbotController] Error in query:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CHAT_001',
          message: error.message || 'Failed to process query',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Create booking through chatbot
   * POST /chatbot/book
   */
  async book(req, res) {
    try {
      // Validate request
      const { error, value } = chatBookingSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { sessionId, tripId, seats, passengerInfo, contactInfo } = value;
      const authToken = req.headers.authorization;

      // Create booking with separate contact info and passenger info
      const result = await chatbotService.createBooking(
        sessionId,
        tripId,
        seats,
        passengerInfo,
        contactInfo,
        authToken
      );

      return res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ChatbotController] Error in book:', error);

      // Handle specific booking errors
      if (error.message.includes('already booked')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BOOK_001',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CHAT_002',
          message: error.message || 'Failed to create booking',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get conversation history
   * GET /chatbot/sessions/:sessionId/history
   */
  async getHistory(req, res) {
    try {
      // Validate session ID
      const { error, value } = sessionIdSchema.validate(req.params);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { sessionId } = value;

      // Get history
      const history = await chatbotService.getConversationHistory(sessionId);

      return res.json({
        success: true,
        data: {
          sessionId,
          messages: history,
          count: history.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ChatbotController] Error getting history:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CHAT_003',
          message: 'Failed to retrieve conversation history',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Reset conversation
   * POST /chatbot/sessions/:sessionId/reset
   */
  async resetConversation(req, res) {
    try {
      // Validate session ID
      const { error, value } = sessionIdSchema.validate(req.params);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { sessionId } = value;

      // Reset conversation
      const result = await chatbotService.resetConversation(sessionId);

      return res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ChatbotController] Error resetting conversation:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CHAT_004',
          message: 'Failed to reset conversation',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Submit feedback
   * POST /chatbot/feedback
   */
  async submitFeedback(req, res) {
    try {
      // Validate request
      const { error, value } = feedbackSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { sessionId, messageId, rating, comment } = value;

      // Save feedback
      const result = await chatbotService.saveFeedback(sessionId, messageId, rating, comment);

      return res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ChatbotController] Error submitting feedback:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CHAT_005',
          message: 'Failed to save feedback',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Submit passenger information form
   * POST /chatbot/submit-passenger-info
   */
  async submitPassengerInfo(req, res) {
    try {
      // Validate request
      const { error, value } = passengerInfoFormSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: error.details.map((d) => d.message).join(', '),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { sessionId, passengers } = value;
      const userInfo = extractUserInfo(req);

      // Extract token from Authorization header
      let authToken = req.headers.authorization;
      if (authToken && authToken.startsWith('Bearer ')) {
        authToken = authToken.substring(7);
      }

      // Process passenger information
      const result = await chatbotService.processPassengerInfo(
        sessionId,
        passengers,
        userInfo.userId,
        authToken
      );

      return res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ChatbotController] Error submitting passenger info:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CHAT_006',
          message: error.message || 'Failed to process passenger information',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new ChatbotController();

