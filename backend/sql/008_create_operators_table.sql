-- 1. Bảng Operators
CREATE TABLE IF NOT EXISTS operators (
    operator_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) UNIQUE, -- Email nên là duy nhất
    contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    rating NUMERIC(3, 1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5), -- Rating từ 0.0 đến 5.0
    logo_url VARCHAR(255),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index để tìm kiếm nhanh theo status và sort theo ngày tạo
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);
CREATE INDEX IF NOT EXISTS idx_operators_created_at ON operators(created_at);