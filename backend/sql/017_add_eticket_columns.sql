-- Migration: Add eTicket support to bookings table
-- File: 017_add_eticket_columns.sql
-- Created: 2025-12-07

BEGIN;

-- Add ticket_url column for PDF download link
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS ticket_url TEXT;

-- Add qr_code_url column for QR code data URL
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Add index for faster ticket lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_url 
  ON bookings(ticket_url) 
  WHERE ticket_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN bookings.ticket_url IS 'URL to download PDF ticket (e.g., http://localhost:3004/tickets/ticket-BK20251207001.pdf)';
COMMENT ON COLUMN bookings.qr_code_url IS 'Base64 encoded QR code data URL for ticket verification';

COMMIT;

-- Rollback script (if needed):
-- ALTER TABLE bookings DROP COLUMN IF EXISTS ticket_url;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS qr_code_url;
-- DROP INDEX IF EXISTS idx_bookings_ticket_url;
