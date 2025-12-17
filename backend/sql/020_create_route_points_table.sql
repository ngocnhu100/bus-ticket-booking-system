-- 022_create_route_points_table.sql

-- Create route_points table
CREATE TABLE IF NOT EXISTS route_points (
  point_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  address TEXT DEFAULT '',
  departure_offset_minutes INTEGER, -- minutes from route/trip departure when departing this point
  arrival_offset_minutes INTEGER, -- minutes from route/trip departure when arriving at this point
  is_pickup BOOLEAN DEFAULT TRUE,
  is_dropoff BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(route_id, sequence)
);

CREATE OR REPLACE FUNCTION update_route_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_route_points_updated_at
  BEFORE UPDATE ON route_points
  FOR EACH ROW
  EXECUTE FUNCTION update_route_points_updated_at();

CREATE INDEX IF NOT EXISTS idx_route_points_route_id ON route_points(route_id);
CREATE INDEX IF NOT EXISTS idx_route_points_sequence ON route_points(route_id, sequence);
