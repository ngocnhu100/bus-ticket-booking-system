-- Create chatbot_sessions table
CREATE TABLE IF NOT EXISTS chatbot_sessions (
    session_id VARCHAR(50) PRIMARY KEY,
    user_id UUID,
    booking_context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_user_id ON chatbot_sessions(user_id);

-- Create index on last_activity_at for session cleanup
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_last_activity ON chatbot_sessions(last_activity_at);

COMMENT ON TABLE chatbot_sessions IS 'Stores chatbot conversation sessions';
COMMENT ON COLUMN chatbot_sessions.session_id IS 'Unique session identifier';
COMMENT ON COLUMN chatbot_sessions.user_id IS 'User ID if logged in, NULL for guest';
COMMENT ON COLUMN chatbot_sessions.booking_context IS 'JSON context for ongoing booking process';
COMMENT ON COLUMN chatbot_sessions.last_activity_at IS 'Last message timestamp for session expiry';