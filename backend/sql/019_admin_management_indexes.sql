-- Migration: Add indexes and constraints for admin management
-- This migration adds performance optimizations and additional constraints for admin user management

-- Add index on role column for faster admin queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add index on role and password_hash for active/inactive admin queries
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, password_hash) WHERE role = 'admin';

-- Add index for email searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));

-- Add index for full_name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_fullname_lower ON users(LOWER(full_name));

-- Add composite index for admin listing with created_at ordering
CREATE INDEX IF NOT EXISTS idx_users_admin_created ON users(role, created_at DESC) WHERE role = 'admin';

-- Ensure email uniqueness constraint exists (should already exist from initial migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_email_unique' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- Ensure phone uniqueness constraint exists (should already exist from initial migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_phone_unique' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);
  END IF;
END $$;

-- Add check constraint to ensure admin accounts have valid email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'admin_email_required' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT admin_email_required 
      CHECK (role != 'admin' OR (role = 'admin' AND email IS NOT NULL));
  END IF;
END $$;

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to count active admins (for validation)
CREATE OR REPLACE FUNCTION count_active_admins()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users WHERE role = 'admin' AND password_hash IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Add comment to the users table
COMMENT ON TABLE users IS 'Stores user accounts including passengers, admins, and Google OAuth users';

-- Add comments to specific columns
COMMENT ON COLUMN users.role IS 'User role: passenger or admin';
COMMENT ON COLUMN users.password_hash IS 'Hashed password. NULL indicates deactivated account';
COMMENT ON COLUMN users.email_verified IS 'Whether email has been verified';
COMMENT ON COLUMN users.phone_verified IS 'Whether phone has been verified';
COMMENT ON COLUMN users.google_id IS 'Google OAuth user ID for social login';
COMMENT ON COLUMN users.preferences IS 'User notification and preference settings in JSONB format';

-- Create a view for active admin accounts
CREATE OR REPLACE VIEW active_admin_accounts AS
SELECT 
  user_id,
  email,
  phone,
  full_name,
  role,
  email_verified,
  phone_verified,
  created_at,
  updated_at
FROM users
WHERE role = 'admin' AND password_hash IS NOT NULL
ORDER BY created_at DESC;

COMMENT ON VIEW active_admin_accounts IS 'View of all active admin accounts (password_hash IS NOT NULL)';

-- Grant appropriate permissions (adjust based on your database user setup)
-- GRANT SELECT, INSERT, UPDATE ON users TO your_app_user;
-- GRANT SELECT ON active_admin_accounts TO your_app_user;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 019_admin_management_indexes completed successfully';
END $$;
