const feedbackRepository = require('../repositories/feedbackRepository');

class FeedbackController {
  /**
   * Get feedback statistics
   * GET /chatbot/admin/feedback/stats
   */
  async getStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await feedbackRepository.getFeedbackStats(startDate, endDate);

      return res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FeedbackController] Error getting stats:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FEEDBACK_001',
          message: 'Failed to retrieve feedback statistics',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get recent feedback
   * GET /chatbot/admin/feedback/recent
   */
  async getRecent(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const feedback = await feedbackRepository.getRecentFeedback(limit, offset);
      const total = await feedbackRepository.countFeedback();

      return res.json({
        success: true,
        data: {
          feedback,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FeedbackController] Error getting recent feedback:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FEEDBACK_002',
          message: 'Failed to retrieve recent feedback',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get negative feedback
   * GET /chatbot/admin/feedback/negative
   */
  async getNegative(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const feedback = await feedbackRepository.getNegativeFeedback(limit, offset);
      const total = await feedbackRepository.countFeedback({ rating: 'negative' });

      return res.json({
        success: true,
        data: {
          feedback,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FeedbackController] Error getting negative feedback:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FEEDBACK_003',
          message: 'Failed to retrieve negative feedback',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get feedback with comments
   * GET /chatbot/admin/feedback/comments
   */
  async getWithComments(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const feedback = await feedbackRepository.getFeedbackWithComments(limit, offset);
      const total = await feedbackRepository.countFeedback({ hasComment: true });

      return res.json({
        success: true,
        data: {
          feedback,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FeedbackController] Error getting feedback with comments:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FEEDBACK_004',
          message: 'Failed to retrieve feedback with comments',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get feedback trend
   * GET /chatbot/admin/feedback/trend
   */
  async getTrend(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;

      const trend = await feedbackRepository.getFeedbackTrend(days);

      return res.json({
        success: true,
        data: {
          trend,
          days,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FeedbackController] Error getting feedback trend:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FEEDBACK_005',
          message: 'Failed to retrieve feedback trend',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get feedback for a specific session
   * GET /chatbot/admin/feedback/session/:sessionId
   */
  async getBySession(req, res) {
    try {
      const { sessionId } = req.params;

      const feedback = await feedbackRepository.getFeedbackBySession(sessionId);

      return res.json({
        success: true,
        data: feedback,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FeedbackController] Error getting session feedback:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FEEDBACK_006',
          message: 'Failed to retrieve session feedback',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new FeedbackController();
