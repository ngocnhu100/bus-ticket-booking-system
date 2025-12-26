-- Add seat_capacity column to buses table
ALTER TABLE buses ADD COLUMN seat_capacity INTEGER;

-- Update existing records to set seat_capacity from bus_models.total_seats
UPDATE buses
SET seat_capacity = bm.total_seats
FROM bus_models bm
WHERE buses.bus_model_id = bm.bus_model_id;

-- Add check constraint to ensure seat_capacity is positive
ALTER TABLE buses ADD CONSTRAINT check_seat_capacity_positive CHECK (seat_capacity > 0);