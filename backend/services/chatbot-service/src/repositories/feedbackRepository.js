const pool = require('../database');

class FeedbackRepository {
  /**
   * Save feedback for a chatbot message
   */
  async saveFeedback(sessionId, messageId, rating, comment = null) {
    try {
      const query = `
        INSERT INTO chatbot_feedback (session_id, message_id, rating, comment)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (session_id, message_id)
        DO UPDATE SET 
          rating = EXCLUDED.rating,
          comment = EXCLUDED.comment,
          created_at = NOW()
        RETURNING *
      `;
      
      const result = await pool.query(query, [sessionId, messageId, rating, comment]);
      return result.rows[0];
    } catch (error) {
      console.error('[FeedbackRepository] Error saving feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback for a specific message
   */
  async getFeedbackByMessage(messageId) {
    try {
      const query = `
        SELECT * FROM chatbot_feedback
        WHERE message_id = $1
      `;
      
      const result = await pool.query(query, [messageId]);
      return result.rows[0];
    } catch (error) {
      console.error('[FeedbackRepository] Error getting feedback:', error);
      throw error;
    }
  }

  /**
   * Get all feedback for a session
   */
  async getFeedbackBySession(sessionId) {
    try {
      const query = `
        SELECT 
          f.*,
          m.role,
          m.content as message_content,
          m.created_at as message_created_at
        FROM chatbot_feedback f
        JOIN chatbot_messages m ON f.message_id = m.message_id
        WHERE f.session_id = $1
        ORDER BY f.created_at DESC
      `;
      
      const result = await pool.query(query, [sessionId]);
      return result.rows;
    } catch (error) {
      console.error('[FeedbackRepository] Error getting session feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(startDate = null, endDate = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_feedback,
          COUNT(CASE WHEN rating = 'positive' THEN 1 END) as positive_count,
          COUNT(CASE WHEN rating = 'negative' THEN 1 END) as negative_count,
          COUNT(CASE WHEN comment IS NOT NULL AND comment != '' THEN 1 END) as with_comment_count,
          ROUND(
            COUNT(CASE WHEN rating = 'positive' THEN 1 END)::numeric / 
            NULLIF(COUNT(*)::numeric, 0) * 100, 
            2
          ) as positive_percentage
        FROM chatbot_feedback
      `;
      
      const params = [];
      if (startDate && endDate) {
        query += ' WHERE created_at BETWEEN $1 AND $2';
        params.push(startDate, endDate);
      } else if (startDate) {
        query += ' WHERE created_at >= $1';
        params.push(startDate);
      } else if (endDate) {
        query += ' WHERE created_at <= $1';
        params.push(endDate);
      }
      
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('[FeedbackRepository] Error getting feedback stats:', error);
      throw error;
    }
  }

  /**
   * Get recent feedback with details
   */
  async getRecentFeedback(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          f.*,
          m.role,
          m.content as message_content,
          m.created_at as message_created_at,
          s.user_id
        FROM chatbot_feedback f
        JOIN chatbot_messages m ON f.message_id = m.message_id
        JOIN chatbot_sessions s ON f.session_id = s.session_id
        ORDER BY f.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('[FeedbackRepository] Error getting recent feedback:', error);
      throw error;
    }
  }

  /**
   * Get negative feedback (for review)
   */
  async getNegativeFeedback(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          f.*,
          m.role,
          m.content as message_content,
          m.created_at as message_created_at,
          s.user_id
        FROM chatbot_feedback f
        JOIN chatbot_messages m ON f.message_id = m.message_id
        JOIN chatbot_sessions s ON f.session_id = s.session_id
        WHERE f.rating = 'negative'
        ORDER BY f.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('[FeedbackRepository] Error getting negative feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback with comments
   */
  async getFeedbackWithComments(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          f.*,
          m.role,
          m.content as message_content,
          m.created_at as message_created_at,
          s.user_id
        FROM chatbot_feedback f
        JOIN chatbot_messages m ON f.message_id = m.message_id
        JOIN chatbot_sessions s ON f.session_id = s.session_id
        WHERE f.comment IS NOT NULL AND f.comment != ''
        ORDER BY f.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('[FeedbackRepository] Error getting feedback with comments:', error);
      throw error;
    }
  }

  /**
   * Get feedback trend over time
   */
  async getFeedbackTrend(days = 30) {
    try {
      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          COUNT(CASE WHEN rating = 'positive' THEN 1 END) as positive,
          COUNT(CASE WHEN rating = 'negative' THEN 1 END) as negative
        FROM chatbot_feedback
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('[FeedbackRepository] Error getting feedback trend:', error);
      throw error;
    }
  }

  /**
   * Delete old feedback (for data retention)
   */
  async deleteOldFeedback(daysToKeep = 365) {
    try {
      const query = `
        DELETE FROM chatbot_feedback
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
        RETURNING feedback_id
      `;
      
      const result = await pool.query(query);
      return result.rows.length;
    } catch (error) {
      console.error('[FeedbackRepository] Error deleting old feedback:', error);
      throw error;
    }
  }

  /**
   * Count total feedback
   */
  async countFeedback(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM chatbot_feedback';
      const params = [];
      const conditions = [];

      if (filters.rating) {
        conditions.push(`rating = $${params.length + 1}`);
        params.push(filters.rating);
      }

      if (filters.hasComment) {
        conditions.push(`comment IS NOT NULL AND comment != ''`);
      }

      if (filters.startDate) {
        conditions.push(`created_at >= $${params.length + 1}`);
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        conditions.push(`created_at <= $${params.length + 1}`);
        params.push(filters.endDate);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const result = await pool.query(query, params);
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error('[FeedbackRepository] Error counting feedback:', error);
      throw error;
    }
  }
}

module.exports = new FeedbackRepository();
