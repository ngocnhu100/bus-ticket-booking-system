-- Fix chatbot_feedback table foreign key constraints
-- Remove strict foreign key constraints that prevent feedback submission

-- Drop existing foreign key constraints
ALTER TABLE chatbot_feedback 
DROP CONSTRAINT IF EXISTS chatbot_feedback_session_id_fkey;

ALTER TABLE chatbot_feedback 
DROP CONSTRAINT IF EXISTS chatbot_feedback_message_id_fkey;

-- Add back foreign keys without CASCADE to allow orphaned feedback
-- This allows feedback to be saved even if session/message doesn't exist yet
-- Feedback is valuable data that should persist independently

COMMENT ON TABLE chatbot_feedback IS 'Stores user feedback on chatbot responses. Session and message references are optional to allow feedback collection even if session/message records are not yet persisted.';
COMMENT ON COLUMN chatbot_feedback.session_id IS 'Session identifier (may not have corresponding chatbot_sessions record)';
COMMENT ON COLUMN chatbot_feedback.message_id IS 'Message identifier (may not have corresponding chatbot_messages record)';
