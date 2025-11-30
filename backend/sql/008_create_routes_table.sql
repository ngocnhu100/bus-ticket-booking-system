CREATE TABLE IF NOT EXISTS routes (
  route_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  distance_km INTEGER,
  estimated_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE routes
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE routes ADD CONSTRAINT uk_routes_name UNIQUE (name);

CREATE INDEX IF NOT EXISTS idx_routes_origin_destination 
ON routes(origin, destination);