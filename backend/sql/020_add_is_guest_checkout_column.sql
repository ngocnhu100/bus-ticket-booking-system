-- 020_add_is_guest_checkout_column.sql
-- Add is_guest_checkout column to bookings table
ALTER TABLE bookings ADD COLUMN is_guest_checkout BOOLEAN DEFAULT FALSE;