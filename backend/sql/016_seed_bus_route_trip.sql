-- =====================================================
-- SEED DATA HOÀN CHỈNH – GIỮ LẠI bus_models + seat_layouts
-- Chạy 1 lần duy nhất sau khi tất cả migration xong
-- =====================================================

-- 1. bus_models + seat_layouts (rất quan trọng cho chọn ghế)
INSERT INTO bus_models (name, total_seats) VALUES
('Hyundai Universe 45 chỗ ghế ngồi', 45),
('Thaco Mobihome 34 giường nằm đôi', 34),
('Samco Isuzu Limousine 29 chỗ', 29),
('Tracomeco Highlander 38 giường nằm', 38),
('Fuso Rosa 22 chỗ ghế ngồi', 22)
ON CONFLICT (name) DO NOTHING;

-- Layout mẫu cho 3 loại phổ biến nhất
INSERT INTO seat_layouts (bus_model_id, layout_json) VALUES
-- Hyundai Universe 45 chỗ (2-2 + hàng cuối 5)
((SELECT bus_model_id FROM bus_models WHERE name LIKE '%45 chỗ%'),
 '{
   "type": "seated",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["A1","A2",null,"B1","B2"]},
     {"row": 2, "seats": ["A3","A4",null,"B3","B4"]},
     {"row": 3, "seats": ["A5","A6",null,"B5","B6"]},
     {"row": 4, "seats": ["A7","A8",null,"B7","B8"]},
     {"row": 5, "seats": ["A9","A10",null,"B9","B10"]},
     {"row": 6, "seats": ["A11","A12",null,"B11","B12"]},
     {"row": 7, "seats": ["A13","A14",null,"B13","B14"]},
     {"row": 8, "seats": ["A15","A16",null,"B15","B16"]},
     {"row": 9, "seats": ["A17","A18",null,"B17","B18"]},
     {"row": 10, "seats": ["A19","A20","A21","A22","A23"]}
   ]
 }'),

-- Thaco Mobihome 34 giường nằm (2 tầng)
((SELECT bus_model_id FROM bus_models WHERE name LIKE '%34 giường%'),
 '{
   "type": "sleeper",
   "floors": 2,
   "rows": [
     {"floor": 1, "row": 1, "seats": ["H1A","H1B"]},
     {"floor": 1, "row": 2, "seats": ["H2A","H2B"]},
     {"floor": 1, "row": 3, "seats": ["H3A","H3B"]},
     {"floor": 1, "row": 4, "seats": ["H4A","H4B"]},
     {"floor": 1, "row": 5, "seats": ["H5A","H5B"]},
     {"floor": 1, "row": 6, "seats": ["H6A","H6B"]},
     {"floor": 1, "row": 7, "seats": ["H7A","H7B"]},
     {"floor": 1, "row": 8, "seats": ["H8A","H8B"]},
     {"floor": 1, "row": 9, "seats": ["H9A","H9B"]},
     {"floor": 2, "row": 1, "seats": ["H10A","H10B"]},
     {"floor": 2, "row": 2, "seats": ["H11A","H11B"]},
     {"floor": 2, "row": 3, "seats": ["H12A","H12B"]},
     {"floor": 2, "row": 4, "seats": ["H13A","H13B"]},
     {"floor": 2, "row": 5, "seats": ["H14A","H14B"]}
   ]
 }'),

-- Samco Isuzu Limousine 29 chỗ (2-1 VIP)
((SELECT bus_model_id FROM bus_models WHERE name LIKE '%Limousine 29%'),
 '{
   "type": "limousine",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["VIP1",null,"VIP2"]},
     {"row": 2, "seats": ["VIP3",null,"VIP4"]},
     {"row": 3, "seats": ["VIP5",null,"VIP6"]},
     {"row": 4, "seats": ["VIP7",null,"VIP8"]},
     {"row": 5, "seats": ["VIP9",null,"VIP10"]},
     {"row": 6, "seats": ["VIP11",null,"VIP12"]},
     {"row": 7, "seats": ["VIP13",null,"VIP14"]},
     {"row": 8, "seats": ["VIP15",null,"VIP16"]},
     {"row": 9, "seats": ["VIP17",null,"VIP18"]},
     {"row": 10, "seats": ["VIP19","VIP20","VIP21"]}
   ]
 }')
ON CONFLICT DO NOTHING;

-- 2. operators (thêm logo_url)
INSERT INTO operators (name, contact_email, contact_phone, status, rating, logo_url) VALUES
('Mai Linh Express', 'mailinh@bus.vn', '19001234', 'approved', 4.5, 'https://example.com/mailinh-logo.png'),
('Phuong Trang FUTA Bus', 'futa@bus.vn', '19005678', 'approved', 4.2, 'https://example.com/futa-logo.png'),
('Kumho Samco Buslines', 'kumho@bus.vn', '19009876', 'approved', 4.0, 'https://example.com/kumho-logo.png')
ON CONFLICT (contact_email) DO NOTHING;

-- 3. buses
INSERT INTO buses (operator_id, bus_model_id, license_plate, plate_number, amenities, status) VALUES
((SELECT operator_id FROM operators WHERE name = 'Mai Linh Express'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%45 chỗ%'), '51B-123.45', '123.45', '["wifi","tv","blanket"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Phuong Trang FUTA Bus'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%34 giường%'), '51B-999.99', '999.99', '["wifi","toilet","snack"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Kumho Samco Buslines'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%Limousine 29%'), '51B-777.77', '777.77', '["wifi","tv","snack","leather","massage"]', 'active')
ON CONFLICT (license_plate) DO NOTHING;

-- 4. routes
INSERT INTO routes (origin, destination, distance_km, estimated_minutes) VALUES
('TP. Hồ Chí Minh', 'Đà Lạt', 300, 420),
('TP. Hồ Chí Minh', 'Nha Trang', 450, 540),
('TP. Hồ Chí Minh', 'Cần Thơ', 170, 240),
('Hà Nội', 'Sa Pa', 320, 360)
ON CONFLICT DO NOTHING;

-- 5. route_stops (mẫu cho tuyến SG - Đà Lạt, thêm address và offset)
INSERT INTO route_stops (route_id, name, address, estimated_time_offset, sequence) VALUES
((SELECT route_id FROM routes WHERE origin = 'TP. Hồ Chí Minh' AND destination = 'Đà Lạt'), 'Bến xe Miền Đông', '292 Đinh Bộ Lĩnh, Bình Thạnh', 0, 1),
((SELECT route_id FROM routes WHERE origin = 'TP. Hồ Chí Minh' AND destination = 'Đà Lạt'), 'Ngã 3 Thái Phiên (Bảo Lộc)', 'Bảo Lộc, Lâm Đồng', 180, 2),
((SELECT route_id FROM routes WHERE origin = 'TP. Hồ Chí Minh' AND destination = 'Đà Lạt'), 'Bến xe Liên tỉnh Đà Lạt', '1 Tô Hiến Thành, Đà Lạt', 420, 3);

-- 6. trips mẫu (thêm policies, status 'active')
INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, policies, status) VALUES
((SELECT route_id FROM routes WHERE origin = 'TP. Hồ Chí Minh' AND destination = 'Đà Lạt'),
 (SELECT bus_id FROM buses WHERE license_plate = '51B-123.45'),
 '2025-12-10 08:00:00', '2025-12-10 15:00:00', 350000.00, '{"cancellation_policy": "24h free", "modification_policy": "Flexible", "refund_policy": "Full"}'::jsonb, 'active'),

((SELECT route_id FROM routes WHERE origin = 'TP. Hồ Chí Minh' AND destination = 'Đà Lạt'),
 (SELECT bus_id FROM buses WHERE license_plate = '51B-999.99'),
 '2025-12-10 22:00:00', '2025-12-11 05:30:00', 520000.00, '{"cancellation_policy": "24h free", "modification_policy": "Flexible", "refund_policy": "Full"}'::jsonb, 'active'),

((SELECT route_id FROM routes WHERE origin = 'TP. Hồ Chí Minh' AND destination = 'Nha Trang'),
 (SELECT bus_id FROM buses WHERE license_plate = '51B-777.77'),
 '2025-12-11 20:30:00', '2025-12-12 05:00:00', 480000.00, '{"cancellation_policy": "24h free", "modification_policy": "Flexible", "refund_policy": "Full"}'::jsonb, 'active');

-- 7. seats (ghế cố định cho từng xe – bắt buộc để đặt vé)
WITH buses_data AS (
  SELECT bus_id, bus_model_id, 
         (SELECT total_seats FROM bus_models m WHERE m.bus_model_id = b.bus_model_id) as total
  FROM buses b
)
INSERT INTO seats (bus_id, seat_code, seat_type, position, price, is_active)
SELECT 
  bus_id,
  'A' || g, 'standard', 'aisle', 0, true
FROM buses_data, generate_series(1, total) g
WHERE total >= g
ON CONFLICT (bus_id, seat_code) DO NOTHING;

-- SEED DATA: BOOKINGS
-- =========================================================

WITH 
  -- 1. Lấy Trip ID của chuyến SG -> Đà Lạt (xe 51B-123.45)
  trip_dalat AS (
    SELECT t.trip_id, t.base_price
    FROM trips t
    JOIN buses b ON t.bus_id = b.bus_id
    WHERE b.license_plate = '51B-123.45'
    LIMIT 1
  ),
  
  -- 2. Lấy Trip ID của chuyến SG -> Nha Trang (xe 51B-777.77)
  trip_nhatrang AS (
    SELECT t.trip_id, t.base_price
    FROM trips t
    JOIN buses b ON t.bus_id = b.bus_id
    WHERE b.license_plate = '51B-777.77'
    LIMIT 1
  )

-- Insert vào bookings
INSERT INTO bookings (
    booking_id, booking_reference, trip_id, 
    contact_email, contact_phone, status, 
    subtotal, service_fee, total_price, 
    payment_method, payment_status, paid_at, ticket_url
)
VALUES 
-- Booking 1: Confirmed (Đi Đà Lạt)
(
    uuid_generate_v4(), 'BK20251210001', (SELECT trip_id FROM trip_dalat),
    'nguyenvana@gmail.com', '0901234567', 'confirmed',
    (SELECT base_price * 2 FROM trip_dalat), 20000, (SELECT base_price * 2 + 20000 FROM trip_dalat),
    'momo', 'paid', NOW(), 'https://cdn.example.com/tickets/bk1.pdf'
),
-- Booking 2: Pending (Đi Nha Trang)
(
    uuid_generate_v4(), 'BK20251211002', (SELECT trip_id FROM trip_nhatrang),
    'tranthib@gmail.com', '0909888777', 'pending',
    (SELECT base_price * 1 FROM trip_nhatrang), 10000, (SELECT base_price * 1 + 10000 FROM trip_nhatrang),
    NULL, 'unpaid', NULL, NULL
),
-- Booking 3: Cancelled (Đi Đà Lạt)
(
    uuid_generate_v4(), 'BK20251210099', (SELECT trip_id FROM trip_dalat),
    'lecancel@gmail.com', '0905555555', 'cancelled',
    (SELECT base_price * 1 FROM trip_dalat), 10000, (SELECT base_price * 1 + 10000 FROM trip_dalat),
    'visa', 'refunded', NOW() - INTERVAL '1 day', NULL
);

-- =========================================================
-- SEED DATA: BOOKING PASSENGERS
-- =========================================================

INSERT INTO booking_passengers (booking_id, seat_code, price, full_name, phone, document_id)
VALUES
-- Khách cho Booking 1 (Đà Lạt - 2 ghế A1, A2)
(
    (SELECT booking_id FROM bookings WHERE booking_reference = 'BK20251210001'),
    'A1', 350000, 'Nguyen Van A', '0901234567', '079012345678'
),
(
    (SELECT booking_id FROM bookings WHERE booking_reference = 'BK20251210001'),
    'A2', 350000, 'Nguyen Van B', '0901234568', NULL
),

-- Khách cho Booking 2 (Nha Trang - 1 ghế VIP1)
-- Lưu ý: Seat Code phải khớp với logic tạo ghế ở phần trước ('A'||g hoặc tên thực tế)
-- Ở phần trước bạn tạo ghế 'A1', 'A2'... nên ta dùng A1 cho Booking 2 (trip khác nhau nên không trùng)
(
    (SELECT booking_id FROM bookings WHERE booking_reference = 'BK20251211002'),
    'A1', 480000, 'Tran Thi B', '0909888777', '079088888888'
),

-- Khách cho Booking 3 (Đã hủy - ghế A5)
(
    (SELECT booking_id FROM bookings WHERE booking_reference = 'BK20251210099'),
    'A5', 350000, 'Le Van Cancel', '0905555555', NULL
);