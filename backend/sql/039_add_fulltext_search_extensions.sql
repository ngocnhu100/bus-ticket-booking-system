-- Enable unaccent extension for accent-insensitive search
-- This allows searching "ha noi" to match "Hà Nội"
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Enable pg_trgm extension for fuzzy/similarity search
-- This allows fuzzy matching and typo-tolerant search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create immutable unaccent function for use in indexes
-- PostgreSQL requires immutable functions for functional indexes
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$
  SELECT unaccent('unaccent', $1)
$$;

-- Add comment for documentation
COMMENT ON FUNCTION immutable_unaccent(text) IS 
  'Immutable wrapper for unaccent function, used for creating functional indexes';
