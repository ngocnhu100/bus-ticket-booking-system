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
     {"floor": 2, "row": 5, "seats": ["H14A","H14B"]},
     {"floor": 2, "row": 6, "seats": ["H15A","H15B"]},
     {"floor": 2, "row": 7, "seats": ["H16A","H16B"]},
     {"floor": 2, "row": 8, "seats": ["H17A","H17B"]}
   ]
 }'),

-- Samco Limousine 29 chỗ
((SELECT bus_model_id FROM bus_models WHERE name LIKE '%Limousine 29%'),
 '{
   "type": "limousine",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["L1","L2",null,"R1","R2"]},
     {"row": 2, "seats": ["L3","L4",null,"R3","R4"]},
     {"row": 3, "seats": ["L5","L6",null,"R5","R6"]},
     {"row": 4, "seats": ["L7","L8",null,"R7","R8"]},
     {"row": 5, "seats": ["L9","L10",null,"R9","R10"]},
     {"row": 6, "seats": ["L11","L12",null,"R11","R12"]},
     {"row": 7, "seats": ["VIP1","VIP2","VIP3","VIP4","VIP5"]}
   ]
 }')
ON CONFLICT (bus_model_id) DO NOTHING;

-- 2. operators
INSERT INTO operators (name, contact_email, contact_phone, status, approved_at) VALUES
('Phương Trang FUTA Bus Lines', 'contact@phuongtrang.vn', '19006067', 'active', NOW()),
('Thành Bưởi',                   'info@thanhbuoi.com.vn',  '19006079', 'active', NOW()),
('Kumho Samco Buslines',        'support@kumhosamco.com.vn','19007077','active', NOW()),
('Mai Linh Express',            'hotline@mailinh.vn',      '19006039', 'active', NOW())
ON CONFLICT (name) DO NOTHING;

-- 3. buses (xe thực tế)
INSERT INTO buses (operator_id, bus_model_id, license_plate, plate_number, amenities, status) VALUES
((SELECT operator_id FROM operators WHERE name = 'Phương Trang FUTA Bus Lines'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%45 chỗ%'), '51B-123.45', '123.45', '["wifi","toilet","water","blanket"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Thành Bưởi'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%34 giường%'), '51B-999.99', '999.99', '["wifi","toilet","massage","charging","snack"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Kumho Samco Buslines'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%Limousine 29%'), '51B-777.77', '777.77', '["wifi","tv","snack","leather","massage"]', 'active')
ON CONFLICT (license_plate) DO NOTHING;

-- 4. routes
INSERT INTO routes (name, origin, destination) VALUES
('TP.HCM - Đà Lạt', 'TP. Hồ Chí Minh', 'Đà Lạt'),
('TP.HCM - Nha Trang', 'TP. Hồ Chí Minh', 'Nha Trang'),
('TP.HCM - Cần Thơ', 'TP. Hồ Chí Minh', 'Cần Thơ'),
('Hà Nội - Sapa', 'Hà Nội', 'Sa Pa')
ON CONFLICT (name) DO NOTHING;

-- 5. route_stops (mẫu cho tuyến SG - Đà Lạt)
INSERT INTO route_stops (route_id, stop_name, sequence) VALUES
((SELECT route_id FROM routes WHERE name = 'TP.HCM - Đà Lạt'), 'Bến xe Miền Đông', 1),
((SELECT route_id FROM routes WHERE name = 'TP.HCM - Đà Lạt'), 'Ngã 3 Thái Phiên (Bảo Lộc)', 2),
((SELECT route_id FROM routes WHERE name = 'TP.HCM - Đà Lạt'), 'Bến xe Liên tỉnh Đà Lạt', 3);

-- 6. trips mẫu (tháng 12/2025)
INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, status) VALUES
((SELECT route_id FROM routes WHERE name = 'TP.HCM - Đà Lạt'),
 (SELECT bus_id FROM buses WHERE license_plate = '51B-123.45'),
 '2025-12-10 08:00:00', '2025-12-10 15:00:00', 350000.00, 'scheduled'),

((SELECT route_id FROM routes WHERE name = 'TP.HCM - Đà Lạt'),
 (SELECT bus_id FROM buses WHERE license_plate = '51B-999.99'),
 '2025-12-10 22:00:00', '2025-12-11 05:30:00', 520000.00, 'scheduled'),

((SELECT route_id FROM routes WHERE name = 'TP.HCM - Nha Trang'),
 (SELECT bus_id FROM buses WHERE license_plate = '51B-777.77'),
 '2025-12-11 20:30:00', '2025-12-12 05:00:00', 480000.00, 'scheduled');

-- 7. seats (ghế cố định cho từng xe – bắt buộc để đặt vé)
WITH buses_data AS (
  SELECT bus_id, bus_model_id, 
         (SELECT total_seats FROM bus_models m WHERE m.bus_model_id = b.bus_model_id) as total
  FROM buses b
)
INSERT INTO seats (bus_id, seat_code, seat_type, is_active)
SELECT 
  bus_id,
  'A' || g, 'standard', true
FROM buses_data, generate_series(1, total) g
WHERE total >= g
ON CONFLICT (bus_id, seat_code) DO NOTHING;

-- Hoàn tất! Bây giờ bạn đã có:
-- • 3 loại xe + layout JSON đầy đủ
-- • 3 nhà xe, 3 xe thực tế
-- • 4 tuyến + điểm dừng
-- • 3 chuyến mẫu
-- • Ghế tự động sinh theo số lượng của model
