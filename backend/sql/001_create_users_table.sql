-- Migration: create users table

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(32) UNIQUE,
  password_hash TEXT,
  full_name VARCHAR(100),
  role VARCHAR(32) DEFAULT 'passenger',
  google_id VARCHAR(255),
  avatar VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{"notifications":{"bookingConfirmations":{"email":true,"sms":false},"tripReminders":{"email":true,"sms":false},"tripUpdates":{"email":true,"sms":false}},"promotionalEmails":false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add google_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_id') THEN
    ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar') THEN
    ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_verified') THEN
    ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferences') THEN
    ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{"notifications":{"bookingConfirmations":{"email":true,"sms":true},"tripReminders":{"email":true,"sms":false},"tripUpdates":{"email":true,"sms":true},"promotionalEmails":false}}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- Index on google_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
