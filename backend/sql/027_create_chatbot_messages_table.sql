-- Create chatbot_messages table
CREATE TABLE IF NOT EXISTS chatbot_messages (
    message_id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (session_id) REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE
);

-- Create index on session_id for faster message retrieval
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_session_id ON chatbot_messages(session_id);

-- Create index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON chatbot_messages(created_at);

-- Create index on role for analytics
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_role ON chatbot_messages(role);

COMMENT ON TABLE chatbot_messages IS 'Stores individual messages in chatbot conversations';
COMMENT ON COLUMN chatbot_messages.message_id IS 'Unique message identifier';
COMMENT ON COLUMN chatbot_messages.session_id IS 'Reference to conversation session';
COMMENT ON COLUMN chatbot_messages.role IS 'Message sender: user, assistant, or system';
COMMENT ON COLUMN chatbot_messages.content IS 'Message text content';
COMMENT ON COLUMN chatbot_messages.metadata IS 'Additional data like intent, entities, actions';
