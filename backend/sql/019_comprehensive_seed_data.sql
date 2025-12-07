-- =====================================================
-- COMPREHENSIVE SEED DATA
-- Contains all necessary seed data for development
-- Run after all table migrations are complete
-- =====================================================

-- 1. Bus Models
INSERT INTO bus_models (name, total_seats) VALUES
('Hyundai Universe 45 seated', 45),
('Thaco Mobihome 34 double sleepers', 34),
('Samco Isuzu Limousine 29 seats', 29),
('Tracomeco Highlander 38 sleepers', 38),
('Fuso Rosa 22 seated', 22),
('Mercedes Sprinter 16 seats', 16),
('Volvo 50 seated', 50)
ON CONFLICT (name) DO NOTHING;

-- 2. Seat Layouts
INSERT INTO seat_layouts (bus_model_id, layout_json) VALUES
-- Hyundai Universe 45 seated
((SELECT bus_model_id FROM bus_models WHERE name = 'Hyundai Universe 45 seated'),
 '{
   "type": "seated",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["VIP1A","VIP1B",null,"VIP1C","VIP1D"]},
     {"row": 2, "seats": ["VIP2A","VIP2B",null,"VIP2C","VIP2D"]},
     {"row": 3, "seats": ["1A","1B",null,"1C","1D"]},
     {"row": 4, "seats": ["2A","2B",null,"2C","2D"]},
     {"row": 5, "seats": ["3A","3B",null,"3C","3D"]},
     {"row": 6, "seats": ["4A","4B",null,"4C","4D"]},
     {"row": 7, "seats": ["5A","5B",null,"5C","5D"]},
     {"row": 8, "seats": ["6A","6B",null,"6C","6D"]},
     {"row": 9, "seats": ["7A","7B",null,"7C","7D"]},
     {"row": 10, "seats": ["8A","8B","8C","8D","8E"]}
   ]
 }'),

-- Thaco Mobihome 34 double sleepers
((SELECT bus_model_id FROM bus_models WHERE name = 'Thaco Mobihome 34 double sleepers'),
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

-- Samco Isuzu Limousine 29 seats
((SELECT bus_model_id FROM bus_models WHERE name = 'Samco Isuzu Limousine 29 seats'),
 '{
   "type": "limousine",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["VIP1A","VIP1B",null,"VIP1C","VIP1D"]},
     {"row": 2, "seats": ["VIP2A","VIP2B",null,"VIP2C","VIP2D"]},
     {"row": 3, "seats": ["1A","1B",null,"1C","1D"]},
     {"row": 4, "seats": ["2A","2B",null,"2C","2D"]},
     {"row": 5, "seats": ["3A","3B",null,"3C","3D"]},
     {"row": 6, "seats": ["4A","4B","4C","4D","4E"]}
   ]
 }'),

-- Tracomeco Highlander 38 sleepers
((SELECT bus_model_id FROM bus_models WHERE name = 'Tracomeco Highlander 38 sleepers'),
 '{
   "type": "sleeper",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["1A","1B"]},
     {"row": 2, "seats": ["2A","2B"]},
     {"row": 3, "seats": ["3A","3B"]},
     {"row": 4, "seats": ["4A","4B"]},
     {"row": 5, "seats": ["5A","5B"]},
     {"row": 6, "seats": ["6A","6B"]},
     {"row": 7, "seats": ["7A","7B"]},
     {"row": 8, "seats": ["8A","8B"]},
     {"row": 9, "seats": ["9A","9B"]},
     {"row": 10, "seats": ["10A","10B"]},
     {"row": 11, "seats": ["11A","11B"]},
     {"row": 12, "seats": ["12A","12B"]},
     {"row": 13, "seats": ["13A","13B"]},
     {"row": 14, "seats": ["14A","14B"]},
     {"row": 15, "seats": ["15A","15B"]},
     {"row": 16, "seats": ["16A","16B"]},
     {"row": 17, "seats": ["17A","17B"]},
     {"row": 18, "seats": ["18A","18B"]},
     {"row": 19, "seats": ["19A","19B"]}
   ]
 }'),

-- Fuso Rosa 22 seated
((SELECT bus_model_id FROM bus_models WHERE name = 'Fuso Rosa 22 seated'),
 '{
   "type": "seated",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["VIP1A","VIP1B",null,"VIP1C","VIP1D"]},
     {"row": 2, "seats": ["1A","1B",null,"1C","1D"]},
     {"row": 3, "seats": ["2A","2B",null,"2C","2D"]},
     {"row": 4, "seats": ["3A","3B",null,"3C","3D"]},
     {"row": 5, "seats": ["4A","4B",null,"4C","4D"]},
     {"row": 6, "seats": ["5A","5B","5C","5D","5E"]}
   ]
 }'),

-- Mercedes Sprinter 16 seats
((SELECT bus_model_id FROM bus_models WHERE name = 'Mercedes Sprinter 16 seats'),
 '{
   "type": "seated",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["VIP1A","VIP1B",null,"VIP1C","VIP1D"]},
     {"row": 2, "seats": ["1A","1B",null,"1C","1D"]},
     {"row": 3, "seats": ["2A","2B",null,"2C","2D"]},
     {"row": 4, "seats": ["3A","3B","3C","3D","3E"]}
   ]
 }'),

-- Volvo 50 seated
((SELECT bus_model_id FROM bus_models WHERE name = 'Volvo 50 seated'),
 '{
   "type": "seated",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["VIP1A","VIP1B",null,"VIP1C","VIP1D"]},
     {"row": 2, "seats": ["VIP2A","VIP2B",null,"VIP2C","VIP2D"]},
     {"row": 3, "seats": ["VIP3A","VIP3B",null,"VIP3C","VIP3D"]},
     {"row": 4, "seats": ["1A","1B",null,"1C","1D"]},
     {"row": 5, "seats": ["2A","2B",null,"2C","2D"]},
     {"row": 6, "seats": ["3A","3B",null,"3C","3D"]},
     {"row": 7, "seats": ["4A","4B",null,"4C","4D"]},
     {"row": 8, "seats": ["5A","5B",null,"5C","5D"]},
     {"row": 9, "seats": ["6A","6B",null,"6C","6D"]},
     {"row": 10, "seats": ["7A","7B","7C","7D","7E"]}
   ]
 }')
ON CONFLICT DO NOTHING;

-- 3. Operators
INSERT INTO operators (name, contact_email, contact_phone, status, rating, logo_url) VALUES
('Sapaco Tourist', 'contact@sapaco.vn', '+84-28-1234-5678', 'approved', 4.5, 'https://example.com/sapaco-logo.png'),
('The Sinh Tourist', 'info@thesinh.vn', '+84-24-8765-4321', 'approved', 4.2, 'https://example.com/thesinh-logo.png'),
('Futa Bus Lines', 'support@futa.vn', '+84-28-9876-5432', 'approved', 4.0, 'https://example.com/futa-logo.png'),
('Giant I', 'info@gianti.vn', '+84-28-1111-2222', 'approved', 4.3, 'https://example.com/gianti-logo.png'),
('Kumho Samco', 'contact@kumhosamco.vn', '+84-24-3333-4444', 'approved', 4.1, 'https://example.com/kumho-logo.png'),
('Sao Viet', 'support@saoviet.vn', '+84-28-5555-6666', 'approved', 3.9, 'https://example.com/saoviet-logo.png')
ON CONFLICT DO NOTHING;

-- 4. Buses
INSERT INTO buses (operator_id, bus_model_id, license_plate, plate_number, amenities, status) VALUES
((SELECT operator_id FROM operators WHERE name = 'Sapaco Tourist' LIMIT 1),
 (SELECT bus_model_id FROM bus_models WHERE name = 'Hyundai Universe 45 seated' LIMIT 1),
 '51A-12345', '51A-12345', '["wifi", "ac", "tv", "refreshments"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'The Sinh Tourist' LIMIT 1),
 (SELECT bus_model_id FROM bus_models WHERE name = 'Tracomeco Highlander 38 sleepers' LIMIT 1),
 '30A-67890', '30A-67890', '["wifi", "ac", "blankets", "pillows"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Futa Bus Lines' LIMIT 1),
 (SELECT bus_model_id FROM bus_models WHERE name = 'Fuso Rosa 22 seated' LIMIT 1),
 '29A-54321', '29A-54321', '["wifi", "ac", "snacks"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Giant I' LIMIT 1),
 (SELECT bus_model_id FROM bus_models WHERE name = 'Volvo 50 seated' LIMIT 1),
 '51B-11111', '51B-11111', '["wifi", "ac", "entertainment", "snacks"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Kumho Samco' LIMIT 1),
 (SELECT bus_model_id FROM bus_models WHERE name = 'Samco Isuzu Limousine 29 seats' LIMIT 1),
 '30B-22222', '30B-22222', '["wifi", "ac", "refreshments"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Sao Viet' LIMIT 1),
 (SELECT bus_model_id FROM bus_models WHERE name = 'Mercedes Sprinter 16 seats' LIMIT 1),
 '29B-33333', '29B-33333', '["wifi", "ac"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Sapaco Tourist' LIMIT 1),
 (SELECT bus_model_id FROM bus_models WHERE name = 'Fuso Rosa 22 seated' LIMIT 1),
 '51C-44444', '51C-44444', '["wifi", "ac", "tv"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'The Sinh Tourist' LIMIT 1),
 (SELECT bus_model_id FROM bus_models WHERE name = 'Hyundai Universe 45 seated' LIMIT 1),
 '30C-55555', '30C-55555', '["wifi", "ac", "blankets"]', 'active')
ON CONFLICT DO NOTHING;

-- 5. Routes
INSERT INTO routes (operator_id, origin, destination, distance_km, estimated_minutes) VALUES
((SELECT operator_id FROM operators WHERE name = 'Sapaco Tourist' LIMIT 1),
 'Ho Chi Minh City', 'Hanoi', 1726, 1800),

((SELECT operator_id FROM operators WHERE name = 'The Sinh Tourist' LIMIT 1),
 'Ho Chi Minh City', 'Da Nang', 964, 900),

((SELECT operator_id FROM operators WHERE name = 'Futa Bus Lines' LIMIT 1),
 'Hanoi', 'Da Nang', 764, 720),

((SELECT operator_id FROM operators WHERE name = 'Giant I' LIMIT 1),
 'Ho Chi Minh City', 'Hue', 1083, 1020),

((SELECT operator_id FROM operators WHERE name = 'Kumho Samco' LIMIT 1),
 'Hanoi', 'Ho Chi Minh City', 1726, 1800),

((SELECT operator_id FROM operators WHERE name = 'Sao Viet' LIMIT 1),
 'Da Nang', 'Ho Chi Minh City', 964, 900),

((SELECT operator_id FROM operators WHERE name = 'Sapaco Tourist' LIMIT 1),
 'Hanoi', 'Sapa', 376, 480),

((SELECT operator_id FROM operators WHERE name = 'The Sinh Tourist' LIMIT 1),
 'Ho Chi Minh City', 'Nha Trang', 448, 420),

((SELECT operator_id FROM operators WHERE name = 'Futa Bus Lines' LIMIT 1),
 'Da Nang', 'Hanoi', 764, 720),

((SELECT operator_id FROM operators WHERE name = 'Giant I' LIMIT 1),
 'Hanoi', 'Hai Phong', 102, 90),

((SELECT operator_id FROM operators WHERE name = 'Kumho Samco' LIMIT 1),
 'Ho Chi Minh City', 'Can Tho', 169, 150),

((SELECT operator_id FROM operators WHERE name = 'Sao Viet' LIMIT 1),
 'Da Nang', 'Quang Ngai', 150, 120)
ON CONFLICT DO NOTHING;

-- 6. Route Stops
INSERT INTO route_stops (route_id, stop_name, sequence, arrival_offset_minutes, departure_offset_minutes) VALUES
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 'Ho Chi Minh City', 1, 0, 0),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 'Da Nang', 2, 540, 550),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 'Hanoi', 3, 1080, 1080),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Nang' LIMIT 1),
 'Ho Chi Minh City', 1, 0, 0),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Nang' LIMIT 1),
 'Da Nang', 2, 540, 540),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Da Nang' LIMIT 1),
 'Hanoi', 1, 0, 0),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Da Nang' LIMIT 1),
 'Da Nang', 2, 360, 360),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hue' LIMIT 1),
 'Ho Chi Minh City', 1, 0, 0),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hue' LIMIT 1),
 'Hue', 2, 600, 600),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1),
 'Hanoi', 1, 0, 0),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1),
 'Da Nang', 2, 360, 370),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1),
 'Ho Chi Minh City', 3, 1080, 1080)
ON CONFLICT DO NOTHING;

-- 7. Trips
INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, policies, status) VALUES
-- Ho Chi Minh City to Hanoi (popular route - multiple trips)
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '51A-12345' LIMIT 1),
 '2025-12-08 08:00:00', '2025-12-08 14:00:00', 500000, '{"refund": "24h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '51C-44444' LIMIT 1),
 '2025-12-08 10:00:00', '2025-12-08 16:00:00', 480000, '{"refund": "24h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '51A-12345' LIMIT 1),
 '2025-12-08 14:00:00', '2025-12-08 20:00:00', 520000, '{"refund": "12h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '51C-44444' LIMIT 1),
 '2025-12-08 18:00:00', '2025-12-09 00:00:00', 450000, '{"refund": "24h", "changes": "not_allowed"}', 'active'),

-- Hanoi to Ho Chi Minh City (reverse route - multiple trips)
((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '30C-55555' LIMIT 1),
 '2025-12-09 06:00:00', '2025-12-09 12:00:00', 500000, '{"refund": "24h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '51B-11111' LIMIT 1),
 '2025-12-09 08:00:00', '2025-12-09 14:00:00', 480000, '{"refund": "24h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '30C-55555' LIMIT 1),
 '2025-12-09 12:00:00', '2025-12-09 18:00:00', 520000, '{"refund": "12h", "changes": "allowed"}', 'active'),

-- Ho Chi Minh City to Da Nang (popular route - multiple trips)
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Nang' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '30A-67890' LIMIT 1),
 '2025-12-08 10:00:00', '2025-12-08 18:00:00', 350000, '{"refund": "12h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Nang' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '30B-22222' LIMIT 1),
 '2025-12-08 14:00:00', '2025-12-08 22:00:00', 320000, '{"refund": "24h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Nang' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '30A-67890' LIMIT 1),
 '2025-12-08 18:00:00', '2025-12-09 02:00:00', 380000, '{"refund": "12h", "changes": "not_allowed"}', 'active'),

-- Da Nang to Ho Chi Minh City (reverse route)
((SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Ho Chi Minh City' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '29B-33333' LIMIT 1),
 '2025-12-09 08:00:00', '2025-12-09 16:00:00', 350000, '{"refund": "24h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Ho Chi Minh City' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '29A-54321' LIMIT 1),
 '2025-12-09 12:00:00', '2025-12-09 20:00:00', 320000, '{"refund": "24h", "changes": "allowed"}', 'active'),

-- Hanoi to Da Nang
((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Da Nang' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '29A-54321' LIMIT 1),
 '2025-12-09 06:00:00', '2025-12-09 12:00:00', 250000, '{"refund": "24h", "changes": "not_allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Da Nang' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '30B-22222' LIMIT 1),
 '2025-12-09 10:00:00', '2025-12-09 16:00:00', 280000, '{"refund": "12h", "changes": "allowed"}', 'active'),

-- Da Nang to Hanoi (reverse route)
((SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Hanoi' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '51B-11111' LIMIT 1),
 '2025-12-10 08:00:00', '2025-12-10 14:00:00', 250000, '{"refund": "24h", "changes": "allowed"}', 'active'),

-- Other routes (single trips for now)
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hue' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '51B-11111' LIMIT 1),
 '2025-12-08 12:00:00', '2025-12-08 21:00:00', 400000, '{"refund": "24h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Sapa' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '29B-33333' LIMIT 1),
 '2025-12-09 07:00:00', '2025-12-09 13:00:00', 150000, '{"refund": "12h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Nha Trang' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '30A-67890' LIMIT 1),
 '2025-12-08 16:00:00', '2025-12-08 20:00:00', 200000, '{"refund": "24h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Hai Phong' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '29A-54321' LIMIT 1),
 '2025-12-09 09:00:00', '2025-12-09 10:30:00', 80000, '{"refund": "12h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Can Tho' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '29B-33333' LIMIT 1),
 '2025-12-08 20:00:00', '2025-12-08 21:30:00', 100000, '{"refund": "24h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Quang Ngai' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '30B-22222' LIMIT 1),
 '2025-12-09 14:00:00', '2025-12-09 15:00:00', 50000, '{"refund": "12h", "changes": "allowed"}', 'active')
ON CONFLICT DO NOTHING;

-- Generate seats for all buses
DELETE FROM seats;

INSERT INTO seats (bus_id, seat_code, seat_type, position, price, row_num, col_num, is_active)
SELECT
  b.bus_id,
  seat_element.value #>> '{}' as seat_code,
  CASE
    WHEN seat_element.value #>> '{}' LIKE 'VIP%' THEN 'vip'
    WHEN seat_element.value #>> '{}' LIKE 'H%A' OR seat_element.value #>> '{}' LIKE 'H%B' THEN 'sleeper'
    ELSE 'standard'
  END as seat_type,
  CASE
    WHEN seat_element.value #>> '{}' ~ '^[0-9]+A$' THEN 'window'  -- Row + A = window
    WHEN seat_element.value #>> '{}' ~ '^[0-9]+B$' THEN 'aisle'   -- Row + B = aisle
    WHEN seat_element.value #>> '{}' ~ '^[0-9]+C$' THEN 'aisle'   -- Row + C = aisle
    WHEN seat_element.value #>> '{}' ~ '^[0-9]+D$' THEN 'aisle'   -- Row + D = aisle
    WHEN seat_element.value #>> '{}' ~ '^[0-9]+E$' THEN 'aisle'   -- Row + E = aisle
    ELSE 'aisle'
  END as position,
  CASE
    WHEN seat_element.value #>> '{}' LIKE 'VIP%' THEN 50000  -- VIP surcharge
    WHEN seat_element.value #>> '{}' LIKE 'H%A' OR seat_element.value #>> '{}' LIKE 'H%B' THEN 100000  -- Sleeper surcharge
    ELSE 0
  END as price,
  (row_data->>'row')::integer as row_num,
  seat_element.column_index as col_num,
  true as is_active
FROM buses b
JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
JOIN seat_layouts sl ON bm.bus_model_id = sl.bus_model_id
CROSS JOIN LATERAL jsonb_array_elements(sl.layout_json->'rows') as row_data
CROSS JOIN LATERAL jsonb_array_elements(row_data->'seats') WITH ORDINALITY as seat_element(value, column_index)
WHERE seat_element.value IS NOT NULL
  AND seat_element.value::text != 'null'
ON CONFLICT (bus_id, seat_code) DO NOTHING;