-- Add pickup and dropoff point columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS pickup_point_id UUID REFERENCES route_points(point_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS dropoff_point_id UUID REFERENCES route_points(point_id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_point_id ON bookings(pickup_point_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dropoff_point_id ON bookings(dropoff_point_id);