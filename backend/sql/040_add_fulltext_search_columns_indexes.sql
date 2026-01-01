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

-- Add comments for documentation
COMMENT ON COLUMN routes.origin_tsvector IS 
  'Full-text search vector for origin, updated automatically via trigger';
COMMENT ON COLUMN routes.destination_tsvector IS 
  'Full-text search vector for destination, updated automatically via trigger';
COMMENT ON COLUMN routes.route_tsvector IS 
  'Full-text search vector for combined origin and destination';

COMMENT ON INDEX idx_routes_origin_tsvector IS 
  'GIN index for fast full-text search on origin';
COMMENT ON INDEX idx_routes_destination_tsvector IS 
  'GIN index for fast full-text search on destination';
COMMENT ON INDEX idx_routes_route_tsvector IS 
  'GIN index for fast full-text search on combined route';
COMMENT ON INDEX idx_routes_origin_trgm IS 
  'GIN trigram index for fuzzy/similarity search on origin';
COMMENT ON INDEX idx_routes_destination_trgm IS 
  'GIN trigram index for fuzzy/similarity search on destination';
