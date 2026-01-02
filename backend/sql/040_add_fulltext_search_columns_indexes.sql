-- Add tsvector columns for full-text search on routes table
-- These columns store pre-processed text for fast full-text search

-- Add tsvector column for origin with Vietnamese language configuration
ALTER TABLE routes ADD COLUMN IF NOT EXISTS origin_tsvector tsvector;

-- Add tsvector column for destination with Vietnamese language configuration
ALTER TABLE routes ADD COLUMN IF NOT EXISTS destination_tsvector tsvector;

-- Add tsvector column for combined origin and destination search
ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_tsvector tsvector;

-- Create trigger function to automatically update tsvector columns
-- Uses unaccent for accent-insensitive search
CREATE OR REPLACE FUNCTION routes_tsvector_trigger() RETURNS trigger AS $$
BEGIN
  -- Update origin_tsvector with accent-insensitive text
  NEW.origin_tsvector := to_tsvector('simple', immutable_unaccent(COALESCE(NEW.origin, '')));
  
  -- Update destination_tsvector with accent-insensitive text
  NEW.destination_tsvector := to_tsvector('simple', immutable_unaccent(COALESCE(NEW.destination, '')));
  
  -- Update combined route_tsvector (origin + destination)
  NEW.route_tsvector := to_tsvector('simple', 
    immutable_unaccent(COALESCE(NEW.origin, '') || ' ' || COALESCE(NEW.destination, ''))
  );
  
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to update tsvector columns on INSERT or UPDATE
DROP TRIGGER IF EXISTS routes_tsvector_update ON routes;
CREATE TRIGGER routes_tsvector_update 
  BEFORE INSERT OR UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION routes_tsvector_trigger();

-- Update existing rows with tsvector values
UPDATE routes SET origin = origin;

-- Create GIN indexes for fast full-text search
-- GIN (Generalized Inverted Index) is optimal for full-text search
CREATE INDEX IF NOT EXISTS idx_routes_origin_tsvector 
  ON routes USING GIN (origin_tsvector);

CREATE INDEX IF NOT EXISTS idx_routes_destination_tsvector 
  ON routes USING GIN (destination_tsvector);

CREATE INDEX IF NOT EXISTS idx_routes_route_tsvector 
  ON routes USING GIN (route_tsvector);

-- Create GIN indexes for trigram similarity search (fuzzy matching)
CREATE INDEX IF NOT EXISTS idx_routes_origin_trgm 
  ON routes USING GIN (immutable_unaccent(origin) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_routes_destination_trgm 
  ON routes USING GIN (immutable_unaccent(destination) gin_trgm_ops);

-- Create functional indexes for accent-insensitive ILIKE queries
CREATE INDEX IF NOT EXISTS idx_routes_origin_unaccent 
  ON routes (immutable_unaccent(origin));

CREATE INDEX IF NOT EXISTS idx_routes_destination_unaccent 
  ON routes (immutable_unaccent(destination));

-- Add tsvector column for route stops
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS stop_name_tsvector tsvector;

-- Add tsvector column for route points (pickup/dropoff)
ALTER TABLE route_points ADD COLUMN IF NOT EXISTS name_tsvector tsvector;

-- Create trigger function to automatically update tsvector columns for route_stops
CREATE OR REPLACE FUNCTION route_stops_tsvector_trigger() RETURNS trigger AS $$
BEGIN
  -- Update stop_name_tsvector with accent-insensitive text
  NEW.stop_name_tsvector := to_tsvector('simple', immutable_unaccent(COALESCE(NEW.stop_name, '')));
  
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger function to automatically update tsvector columns for route_points
CREATE OR REPLACE FUNCTION route_points_tsvector_trigger() RETURNS trigger AS $$
BEGIN
  -- Update name_tsvector with accent-insensitive text
  NEW.name_tsvector := to_tsvector('simple', immutable_unaccent(COALESCE(NEW.name, '')));
  
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create triggers to update tsvector columns on INSERT or UPDATE
DROP TRIGGER IF EXISTS route_stops_tsvector_update ON route_stops;
CREATE TRIGGER route_stops_tsvector_update 
  BEFORE INSERT OR UPDATE ON route_stops
  FOR EACH ROW EXECUTE FUNCTION route_stops_tsvector_trigger();

DROP TRIGGER IF EXISTS route_points_tsvector_update ON route_points;
CREATE TRIGGER route_points_tsvector_update 
  BEFORE INSERT OR UPDATE ON route_points
  FOR EACH ROW EXECUTE FUNCTION route_points_tsvector_trigger();

-- Update existing rows with tsvector values
UPDATE route_stops SET stop_name = stop_name;
UPDATE route_points SET name = name;

-- Create GIN indexes for fast full-text search on route_stops
CREATE INDEX IF NOT EXISTS idx_route_stops_stop_name_tsvector 
  ON route_stops USING GIN (stop_name_tsvector);

-- Create GIN indexes for fast full-text search on route_points
CREATE INDEX IF NOT EXISTS idx_route_points_name_tsvector 
  ON route_points USING GIN (name_tsvector);

-- Create GIN indexes for trigram similarity search (fuzzy matching)
CREATE INDEX IF NOT EXISTS idx_route_stops_stop_name_trgm 
  ON route_stops USING GIN (immutable_unaccent(stop_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_route_points_name_trgm 
  ON route_points USING GIN (immutable_unaccent(name) gin_trgm_ops);

-- Create functional indexes for accent-insensitive ILIKE queries
CREATE INDEX IF NOT EXISTS idx_route_stops_stop_name_unaccent 
  ON route_stops (immutable_unaccent(stop_name));

CREATE INDEX IF NOT EXISTS idx_route_points_name_unaccent 
  ON route_points (immutable_unaccent(name));

-- Add comments for documentation
COMMENT ON COLUMN route_stops.stop_name_tsvector IS 
  'Full-text search vector for stop_name, updated automatically via trigger';
COMMENT ON COLUMN route_points.name_tsvector IS 
  'Full-text search vector for name, updated automatically via trigger';

COMMENT ON INDEX idx_route_stops_stop_name_tsvector IS 
  'GIN index for fast full-text search on route_stops.stop_name';
COMMENT ON INDEX idx_route_points_name_tsvector IS 
  'GIN index for fast full-text search on route_points.name';
COMMENT ON INDEX idx_route_stops_stop_name_trgm IS 
  'GIN trigram index for fuzzy/similarity search on route_stops.stop_name';
COMMENT ON INDEX idx_route_points_name_trgm IS 
  'GIN trigram index for fuzzy/similarity search on route_points.name';
