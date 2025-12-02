CREATE TABLE IF NOT EXISTS bookings (
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) UNIQUE NOT NULL, -- Mã vé (VD: BK20251115001)
    
    -- Liên kết Trip & User
    trip_id UUID NOT NULL REFERENCES trips(trip_id) ON DELETE RESTRICT,
    user_id UUID, -- Nullable (cho phép Guest checkout)
    
    -- Thông tin liên hệ người đặt
    contact_email VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    
    -- Trạng thái & Thời gian
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    locked_until TIMESTAMP WITH TIME ZONE, -- Giữ chỗ trong 10 phút
    
    -- Pricing (Lưu snapshot giá tại thời điểm đặt)
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    service_fee DECIMAL(12,2) DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'VND',
    
    -- Payment info
    payment_method VARCHAR(50), -- 'momo', 'zalopay', 'card', etc.
    payment_status VARCHAR(20) DEFAULT 'unpaid' 
        CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Cancellation & Refund info
    cancellation_reason TEXT,
    refund_amount DECIMAL(12,2),
    
    -- Ticket artifacts
    ticket_url TEXT,
    qr_code_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);