CREATE TABLE IF NOT EXISTS booking_passengers (
    ticket_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    
    -- Thông tin ghế (Snapshot)
    seat_code VARCHAR(10) NOT NULL, -- VD: A1, B2
    price DECIMAL(12,2) NOT NULL,   -- Giá vé của riêng ghế này
    
    -- Thông tin hành khách
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    document_id VARCHAR(50),        -- CMND/CCCD
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index tìm kiếm booking của user
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);

-- Index tìm kiếm theo mã vé
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_reference);

-- Index quan trọng: Kiểm tra ghế đã được đặt chưa cho một chuyến đi
-- Logic: Tìm tất cả ghế của trip_id mà status không phải là 'cancelled'
CREATE INDEX IF NOT EXISTS idx_bookings_check_seats 
ON bookings (trip_id, status) 
WHERE status != 'cancelled';