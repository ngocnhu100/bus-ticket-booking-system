-- Migration: add email verification fields to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE;

-- Index on email_verification_token for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);