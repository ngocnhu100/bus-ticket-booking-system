-- Migration: add failed login attempts and account lock fields to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;

-- Index on account_locked_until for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_account_locked_until ON users(account_locked_until);