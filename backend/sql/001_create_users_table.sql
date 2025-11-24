-- Migration: create users table

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(32) UNIQUE,
  password_hash TEXT,
  full_name VARCHAR(100),
  role VARCHAR(32) DEFAULT 'passenger',
  google_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add google_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_id') THEN
    ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
  END IF;
END $$;

-- Index on google_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
