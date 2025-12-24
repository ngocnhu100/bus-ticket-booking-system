-- Migration: Seed initial admin account
-- This creates a default admin account for system initialization
-- Default credentials: admin@example.com / Admin@123

-- Check if any admin account exists
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';
  
  -- Only create default admin if no admin exists
  IF admin_count = 0 THEN
    -- Password: Admin@123
    -- Hashed with bcrypt (12 rounds)
    INSERT INTO users (
      email,
      phone,
      password_hash,
      full_name,
      role,
      email_verified,
      phone_verified,
      created_at,
      updated_at
    )
    VALUES (
      'admin@example.com',
      '0900000001',
      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIFj3QW.6W', -- Admin@123
      'System Administrator',
      'admin',
      true,
      false,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Default admin account created successfully';
    RAISE NOTICE 'Email: admin@example.com';
    RAISE NOTICE 'Password: Admin@123';
    RAISE NOTICE '⚠️  IMPORTANT: Change this password immediately after first login!';
  ELSE
    RAISE NOTICE 'Admin account(s) already exist. Skipping default admin creation.';
  END IF;
END $$;

-- Verify admin account creation
SELECT 
  user_id,
  email,
  full_name,
  role,
  email_verified,
  created_at
FROM users 
WHERE role = 'admin'
ORDER BY created_at;
