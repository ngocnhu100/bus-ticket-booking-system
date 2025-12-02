CREATE TABLE IF NOT EXISTS seats (
    seat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID REFERENCES buses(bus_id) ON DELETE CASCADE,
    seat_code VARCHAR(10) NOT NULL, -- A1, B2, H1A, VIP1...
    seat_type VARCHAR(20) DEFAULT 'standard', -- standard, vip, bed_lower, bed_upper
    position VARCHAR(20) DEFAULT 'aisle', -- window | aisle
    price DECIMAL(12,2) DEFAULT 0, -- Additional price if VIP
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bus_id, seat_code)
);

CREATE INDEX IF NOT EXISTS idx_seats_bus_id ON seats(bus_id);