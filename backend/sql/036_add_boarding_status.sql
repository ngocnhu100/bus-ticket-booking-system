-- Add boarding status to booking_passengers table
-- Allows admins to mark passengers as boarded

ALTER TABLE booking_passengers
ADD COLUMN boarding_status VARCHAR(20) DEFAULT 'not_boarded'
CHECK (boarding_status IN ('not_boarded', 'boarded', 'no_show'));

-- Add index for boarding status queries
CREATE INDEX IF NOT EXISTS idx_booking_passengers_boarding_status
ON booking_passengers (boarding_status);

-- Add boarded_at timestamp
ALTER TABLE booking_passengers
ADD COLUMN boarded_at TIMESTAMP WITH TIME ZONE;

-- Add boarded_by field to track which admin marked them as boarded
ALTER TABLE booking_passengers
ADD COLUMN boarded_by UUID REFERENCES users(user_id);

COMMENT ON COLUMN booking_passengers.boarding_status IS 'Status of passenger boarding: not_boarded, boarded, no_show';
COMMENT ON COLUMN booking_passengers.boarded_at IS 'Timestamp when passenger was marked as boarded';
COMMENT ON COLUMN booking_passengers.boarded_by IS 'Admin user who marked the passenger as boarded';