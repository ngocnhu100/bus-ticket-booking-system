CREATE TABLE IF NOT EXISTS seat_layouts (
  seat_layout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_model_id UUID REFERENCES bus_models(bus_model_id) ON DELETE CASCADE,
  layout_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seat_layouts_bus_model_id ON seat_layouts(bus_model_id);