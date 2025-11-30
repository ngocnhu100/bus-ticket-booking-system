CREATE TABLE IF NOT EXISTS trips (
    trip_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(route_id) ON DELETE RESTRICT,
    bus_id UUID REFERENCES buses(bus_id) ON DELETE RESTRICT,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    base_price DECIMAL(12,2) NOT NULL CHECK (base_price > 0),
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, departed, arrived, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index đúng cách (dùng bảng routes)
CREATE INDEX IF NOT EXISTS idx_trips_search 
ON trips (departure_time)
WHERE status = 'scheduled';

-- Hoặc tốt hơn nữa: tạo index bao phủ để search nhanh
CREATE INDEX IF NOT EXISTS idx_trips_active_route_time 
ON trips (route_id, departure_time)
WHERE status = 'scheduled';