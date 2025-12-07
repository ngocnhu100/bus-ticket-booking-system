-- Migration: Fix NULL user_id in existing bookings
-- Issue: All bookings have user_id = NULL because seed script used non-existent email
-- Solution: Update bookings to use passenger@bus-ticket.com user_id

-- =====================================================
-- BACKUP BEFORE RUNNING THIS MIGRATION
-- =====================================================
-- pg_dump -U postgres busticket > backup_before_user_id_fix.sql

DO $$
DECLARE
  v_passenger_user_id UUID;
  v_admin_user_id UUID;
  v_updated_count INTEGER;
BEGIN
  -- Get passenger user ID (default test user)
  SELECT user_id INTO v_passenger_user_id
  FROM users
  WHERE email = 'passenger@bus-ticket.com'
  LIMIT 1;

  -- Get admin user ID (alternative)
  SELECT user_id INTO v_admin_user_id
  FROM users
  WHERE email = 'admin@bus-ticket.com'
  LIMIT 1;

  -- Verify users exist
  IF v_passenger_user_id IS NULL THEN
    RAISE EXCEPTION 'passenger@bus-ticket.com not found. Please run 005_seed_users.sql first.';
  END IF;

  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'admin@bus-ticket.com not found. Please run 005_seed_users.sql first.';
  END IF;

  RAISE NOTICE 'Found passenger user: %', v_passenger_user_id;
  RAISE NOTICE 'Found admin user: %', v_admin_user_id;

  -- Strategy: Assign bookings based on contact_email pattern
  -- If contact_email matches existing users, use that user_id
  -- Otherwise, default to passenger user

  -- Update bookings with contact_email = passenger@bus-ticket.com
  UPDATE bookings
  SET user_id = v_passenger_user_id
  WHERE user_id IS NULL
    AND contact_email = 'passenger@bus-ticket.com';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % bookings for passenger@bus-ticket.com', v_updated_count;

  -- Update bookings with contact_email = admin@bus-ticket.com
  UPDATE bookings
  SET user_id = v_admin_user_id
  WHERE user_id IS NULL
    AND contact_email = 'admin@bus-ticket.com';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % bookings for admin@bus-ticket.com', v_updated_count;

  -- Update remaining NULL bookings to passenger user (default)
  -- These are typically guest bookings from seed data
  UPDATE bookings
  SET user_id = v_passenger_user_id
  WHERE user_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % remaining NULL bookings to passenger user', v_updated_count;

  -- Verify no NULL user_id remains (if NOT NULL constraint is desired)
  IF EXISTS (SELECT 1 FROM bookings WHERE user_id IS NULL) THEN
    RAISE WARNING 'Some bookings still have NULL user_id!';
  ELSE
    RAISE NOTICE '✅ All bookings now have valid user_id';
  END IF;

  -- Show summary
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE '=================================================';
  
  -- Show booking counts by user
  DECLARE
    booking_summary RECORD;
  BEGIN
    FOR booking_summary IN 
      SELECT 
        b.user_id,
        u.email,
        COUNT(*) as booking_count
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.user_id
      GROUP BY b.user_id, u.email
    LOOP
      RAISE NOTICE 'User % (%): % bookings', 
        booking_summary.email,
        booking_summary.user_id,
        booking_summary.booking_count;
    END LOOP;
  END;

END $$;

-- Verify results
SELECT 
  b.booking_id,
  b.booking_reference,
  b.status,
  b.contact_email,
  b.user_id,
  u.email as user_email,
  u.full_name
FROM bookings b
LEFT JOIN users u ON b.user_id = u.user_id
ORDER BY b.created_at DESC
LIMIT 10;

-- Count bookings by user
SELECT 
  u.email,
  u.full_name,
  COUNT(b.booking_id) as booking_count,
  SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
  SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
FROM users u
LEFT JOIN bookings b ON u.user_id = b.user_id
WHERE u.role = 'passenger'
GROUP BY u.user_id, u.email, u.full_name
ORDER BY booking_count DESC;

-- =====================================================
-- OPTIONAL: Add NOT NULL constraint if all guest bookings removed
-- =====================================================
-- ALTER TABLE bookings ALTER COLUMN user_id SET NOT NULL;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================
-- If you need to rollback:
-- 1. Restore from backup: psql -U postgres busticket < backup_before_user_id_fix.sql
-- 2. Or manually set back to NULL:
--    UPDATE bookings SET user_id = NULL WHERE booking_reference LIKE 'BK202601%';
