CREATE TABLE IF NOT EXISTS route_stops (
  stop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(route_id) ON DELETE CASCADE,
  stop_name VARCHAR(100) NOT NULL,
  sequence INTEGER NOT NULL,
  UNIQUE(route_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route_sequence ON route_stops(route_id, sequence);