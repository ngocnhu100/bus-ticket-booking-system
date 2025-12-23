-- Create chatbot_feedback table
CREATE TABLE IF NOT EXISTS chatbot_feedback (
    feedback_id SERIAL PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,
    message_id VARCHAR(50) NOT NULL,
    rating VARCHAR(20) NOT NULL CHECK (rating IN ('positive', 'negative')),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (session_id) REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES chatbot_messages(message_id) ON DELETE CASCADE,
    
    -- Ensure only one feedback per message per session
    UNIQUE (session_id, message_id)
);

-- Create index on session_id
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_session_id ON chatbot_feedback(session_id);

-- Create index on message_id
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_message_id ON chatbot_feedback(message_id);

-- Create index on rating for analytics
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_rating ON chatbot_feedback(rating);

COMMENT ON TABLE chatbot_feedback IS 'Stores user feedback on chatbot responses';
COMMENT ON COLUMN chatbot_feedback.rating IS 'User rating: positive (thumbs up) or negative (thumbs down)';
COMMENT ON COLUMN chatbot_feedback.comment IS 'Optional text feedback from user';