-- Migration: Create trips table with optimized indexes
-- This migration creates the trips table structure for the trip-service microservice

-- Create ENUM types for better data integrity
CREATE TYPE bus_type_enum AS ENUM ('standard', 'limousine', 'sleeper');
CREATE TYPE departure_time_enum AS ENUM ('morning', 'afternoon', 'evening', 'night');
CREATE TYPE frequency_enum AS ENUM ('daily', 'weekly', 'weekdays', 'weekends');

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  trip_id VARCHAR(50) PRIMARY KEY,
  
  -- Route information
  route_id VARCHAR(50) NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  distance INTEGER NOT NULL,
  estimated_duration INTEGER NOT NULL, -- in minutes
  
  -- Operator information
  operator_id VARCHAR(50) NOT NULL,
  operator_name VARCHAR(255) NOT NULL,
  operator_rating DECIMAL(3,2),
  operator_logo TEXT,
  
  -- Bus information
  bus_id VARCHAR(50) NOT NULL,
  bus_type bus_type_enum NOT NULL,
  license_plate VARCHAR(32),
  total_seats INTEGER NOT NULL,
  
  -- Schedule information
  schedule_id VARCHAR(50) NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  frequency frequency_enum DEFAULT 'daily',
  
  -- Pricing information
  base_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'VND',
  
  -- Availability
  available_seats INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CHECK (available_seats >= 0),
  CHECK (available_seats <= total_seats),
  CHECK (base_price >= 0),
  CHECK (distance > 0),
  CHECK (estimated_duration > 0)
);

-- Create amenities table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS bus_amenities (
  amenity_id SERIAL PRIMARY KEY,
  amenity_code VARCHAR(50) UNIQUE NOT NULL,
  amenity_name VARCHAR(100) NOT NULL
);

-- Create junction table for trips and amenities
CREATE TABLE IF NOT EXISTS trip_amenities (
  trip_id VARCHAR(50) REFERENCES trips(trip_id) ON DELETE CASCADE,
  amenity_id INTEGER REFERENCES bus_amenities(amenity_id) ON DELETE CASCADE,
  PRIMARY KEY (trip_id, amenity_id)
);

-- Insert default amenities
INSERT INTO bus_amenities (amenity_code, amenity_name) VALUES
  ('wifi', 'WiFi'),
  ('ac', 'Air Conditioning'),
  ('toilet', 'Toilet'),
  ('entertainment', 'Entertainment')
ON CONFLICT (amenity_code) DO NOTHING;

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================

-- Primary search indexes (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_trips_origin ON trips(origin);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_origin_destination ON trips(origin, destination);

-- Composite index for the most common search pattern
CREATE INDEX IF NOT EXISTS idx_trips_search_main 
  ON trips(origin, destination, departure_time, base_price);

-- Filter indexes
CREATE INDEX IF NOT EXISTS idx_trips_bus_type ON trips(bus_type);
CREATE INDEX IF NOT EXISTS idx_trips_departure_time ON trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_trips_base_price ON trips(base_price);
CREATE INDEX IF NOT EXISTS idx_trips_operator_id ON trips(operator_id);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id);

-- Availability index for filtering by available seats
CREATE INDEX IF NOT EXISTS idx_trips_available_seats ON trips(available_seats);

-- Composite index for price range queries
CREATE INDEX IF NOT EXISTS idx_trips_price_range 
  ON trips(base_price) WHERE base_price > 0;

-- Index for amenities lookup
CREATE INDEX IF NOT EXISTS idx_trip_amenities_trip_id ON trip_amenities(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_amenities_amenity_id ON trip_amenities(amenity_id);

-- Partial index for trips with available seats (most common query)
CREATE INDEX IF NOT EXISTS idx_trips_with_availability 
  ON trips(origin, destination, departure_time) 
  WHERE available_seats > 0;

-- GIN index for full-text search on origin and destination (optional but powerful)
CREATE INDEX IF NOT EXISTS idx_trips_origin_gin ON trips USING gin(to_tsvector('english', origin));
CREATE INDEX IF NOT EXISTS idx_trips_destination_gin ON trips USING gin(to_tsvector('english', destination));

-- Index for sorting and pagination
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_trips_updated_at 
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for easier querying with amenities
CREATE OR REPLACE VIEW trips_with_amenities AS
SELECT 
  t.*,
  ARRAY_AGG(
    json_build_object(
      'id', ba.amenity_code,
      'name', ba.amenity_name
    )
  ) FILTER (WHERE ba.amenity_id IS NOT NULL) as amenities
FROM trips t
LEFT JOIN trip_amenities ta ON t.trip_id = ta.trip_id
LEFT JOIN bus_amenities ba ON ta.amenity_id = ba.amenity_id
GROUP BY t.trip_id;

-- Add comments for documentation
COMMENT ON TABLE trips IS 'Main trips table storing all trip information';
COMMENT ON INDEX idx_trips_search_main IS 'Composite index for optimizing most common search queries';
COMMENT ON INDEX idx_trips_with_availability IS 'Partial index for trips with available seats';
