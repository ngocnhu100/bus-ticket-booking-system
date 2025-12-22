const pool = require('../database');
const { v4: uuidv4 } = require('uuid');

class ConversationRepository {
  /**
   * Create a new conversation session
   */
  async createSession(userId = null) {
    const sessionId = `session_${uuidv4()}`;
    const query = `
      INSERT INTO chatbot_sessions (session_id, user_id, created_at, last_activity_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [sessionId, userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    const query = `
      SELECT * FROM chatbot_sessions
      WHERE session_id = $1
    `;

    try {
      const result = await pool.query(query, [sessionId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId) {
    const query = `
      UPDATE chatbot_sessions
      SET last_activity_at = NOW()
      WHERE session_id = $1
    `;

    try {
      await pool.query(query, [sessionId]);
    } catch (error) {
      console.error('Error updating session activity:', error);
      throw error;
    }
  }

  /**
   * Save a message to conversation history
   */
  async saveMessage(sessionId, role, content, metadata = {}) {
    const messageId = `msg_${uuidv4()}`;
    const query = `
      INSERT INTO chatbot_messages (message_id, session_id, role, content, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        messageId,
        sessionId,
        role,
        content,
        JSON.stringify(metadata),
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  async getMessageHistory(sessionId, limit = 20) {
    const query = `
      SELECT message_id, session_id, role, content, metadata, created_at
      FROM chatbot_messages
      WHERE session_id = $1
      ORDER BY created_at ASC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [sessionId, limit]);
      return result.rows.map(row => ({
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      }));
    } catch (error) {
      console.error('Error getting message history:', error);
      throw error;
    }
  }

  /**
   * Get user's recent sessions
   */
  async getUserSessions(userId, limit = 10) {
    const query = `
      SELECT s.*, 
             COUNT(m.message_id) as message_count,
             MAX(m.created_at) as last_message_at
      FROM chatbot_sessions s
      LEFT JOIN chatbot_messages m ON s.session_id = m.session_id
      WHERE s.user_id = $1
      GROUP BY s.session_id
      ORDER BY s.last_activity_at DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }

  /**
   * Delete conversation history for a session
   */
  async deleteSessionMessages(sessionId) {
    const query = `
      DELETE FROM chatbot_messages
      WHERE session_id = $1
    `;

    try {
      await pool.query(query, [sessionId]);
    } catch (error) {
      console.error('Error deleting session messages:', error);
      throw error;
    }
  }

  /**
   * Save booking context for session
   */
  async saveBookingContext(sessionId, bookingContext) {
    const query = `
      UPDATE chatbot_sessions
      SET booking_context = $1,
          updated_at = NOW()
      WHERE session_id = $2
    `;

    try {
      await pool.query(query, [JSON.stringify(bookingContext), sessionId]);
    } catch (error) {
      console.error('Error saving booking context:', error);
      throw error;
    }
  }

  /**
   * Get booking context for session
   */
  async getBookingContext(sessionId) {
    const query = `
      SELECT booking_context FROM chatbot_sessions
      WHERE session_id = $1
    `;

    try {
      const result = await pool.query(query, [sessionId]);
      if (result.rows[0]?.booking_context) {
        return typeof result.rows[0].booking_context === 'string'
          ? JSON.parse(result.rows[0].booking_context)
          : result.rows[0].booking_context;
      }
      return null;
    } catch (error) {
      console.error('Error getting booking context:', error);
      throw error;
    }
  }

  /**
   * Save user feedback on a message
   */
  async saveFeedback(sessionId, messageId, rating, comment = null) {
    const query = `
      INSERT INTO chatbot_feedback (session_id, message_id, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (session_id, message_id) 
      DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
    `;

    try {
      await pool.query(query, [sessionId, messageId, rating, comment]);
    } catch (error) {
      console.error('Error saving feedback:', error);
      throw error;
    }
  }
}

module.exports = new ConversationRepository();
