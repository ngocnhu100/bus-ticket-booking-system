CREATE TABLE IF NOT EXISTS buses (
    bus_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operators(operator_id) ON DELETE CASCADE,
    bus_model_id UUID REFERENCES bus_models(bus_model_id) ON DELETE RESTRICT,
    
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    plate_number VARCHAR(20),                    -- phần số cuối biển số
    amenities JSONB DEFAULT '[]'::jsonb,         -- ["wifi", "toilet", "charging", ...]
    type VARCHAR(20) DEFAULT 'standard' CHECK (type IN ('standard', 'limousine', 'sleeper')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
    image_url JSONB DEFAULT '[]'::jsonb,         -- Array of image URLs from Cloudinary: ["url1", "url2", ...]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buses_operator_id ON buses(operator_id);
CREATE INDEX IF NOT EXISTS idx_buses_model_id ON buses(bus_model_id);
CREATE INDEX IF NOT EXISTS idx_buses_license_plate ON buses(license_plate);