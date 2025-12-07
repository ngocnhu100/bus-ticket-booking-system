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
     {"row": 1, "seats": ["1A","1B",null,"1C","1D"]},
     {"row": 2, "seats": ["2A","2B",null,"2C","2D"]},
     {"row": 3, "seats": ["3A","3B",null,"3C","3D"]},
     {"row": 4, "seats": ["4A","4B",null,"4C","4D"]},
     {"row": 5, "seats": ["5A","5B",null,"5C","5D"]},
     {"row": 6, "seats": ["6A","6B",null,"6C","6D"]},
     {"row": 7, "seats": ["7A","7B",null,"7C","7D"]},
     {"row": 8, "seats": ["8A","8B",null,"8C","8D"]},
     {"row": 9, "seats": ["9A","9B",null,"9C","9D"]},
     {"row": 10, "seats": ["10A","10B","10C","10D","10E"]}
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
     {"row": 1, "seats": ["1A","1B",null,"1C","1D"]},
     {"row": 2, "seats": ["2A","2B",null,"2C","2D"]},
     {"row": 3, "seats": ["3A","3B",null,"3C","3D"]},
     {"row": 4, "seats": ["4A","4B",null,"4C","4D"]},
     {"row": 5, "seats": ["5A","5B",null,"5C","5D"]},
     {"row": 6, "seats": ["6A","6B","6C","6D","6E"]}
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
     {"row": 1, "seats": ["1A","1B",null,"1C","1D"]},
     {"row": 2, "seats": ["2A","2B",null,"2C","2D"]},
     {"row": 3, "seats": ["3A","3B",null,"3C","3D"]},
     {"row": 4, "seats": ["4A","4B",null,"4C","4D"]},
     {"row": 5, "seats": ["5A","5B",null,"5C","5D"]},
     {"row": 6, "seats": ["6A","6B","6C","6D","6E"]}
   ]
 }'),

-- Mercedes Sprinter 16 seats
((SELECT bus_model_id FROM bus_models WHERE name = 'Mercedes Sprinter 16 seats'),
 '{
   "type": "seated",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["1A","1B",null,"1C","1D"]},
     {"row": 2, "seats": ["2A","2B",null,"2C","2D"]},
     {"row": 3, "seats": ["3A","3B",null,"3C","3D"]},
     {"row": 4, "seats": ["4A","4B","4C","4D","4E"]}
   ]
 }'),

-- Volvo 50 seated
((SELECT bus_model_id FROM bus_models WHERE name = 'Volvo 50 seated'),
 '{
   "type": "seated",
   "floors": 1,
   "rows": [
     {"row": 1, "seats": ["1A","1B",null,"1C","1D"]},
     {"row": 2, "seats": ["2A","2B",null,"2C","2D"]},
     {"row": 3, "seats": ["3A","3B",null,"3C","3D"]},
     {"row": 4, "seats": ["4A","4B",null,"4C","4D"]},
     {"row": 5, "seats": ["5A","5B",null,"5C","5D"]},
     {"row": 6, "seats": ["6A","6B",null,"6C","6D"]},
     {"row": 7, "seats": ["7A","7B",null,"7C","7D"]},
     {"row": 8, "seats": ["8A","8B",null,"8C","8D"]},
     {"row": 9, "seats": ["9A","9B",null,"9C","9D"]},
     {"row": 10, "seats": ["10A","10B","10C","10D","10E"]}
   ]
 }')
ON CONFLICT DO NOTHING;

-- 3. Operators
INSERT INTO operators (name, contact_email, contact_phone, status, rating, logo_url) VALUES
('Sapaco Tourist', 'contact@sapaco.vn', '+84-28-1234-5678', 'active', 4.5, 'https://example.com/sapaco-logo.png'),
('The Sinh Tourist', 'info@thesinh.vn', '+84-24-8765-4321', 'active', 4.2, 'https://example.com/thesinh-logo.png'),
('Futa Bus Lines', 'support@futa.vn', '+84-28-9876-5432', 'active', 4.0, 'https://example.com/futa-logo.png')
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
 '29A-54321', '29A-54321', '["wifi", "ac", "snacks"]', 'active')
ON CONFLICT DO NOTHING;

-- 5. Routes
INSERT INTO routes (operator_id, origin, destination, distance_km, estimated_minutes) VALUES
((SELECT operator_id FROM operators WHERE name = 'Sapaco Tourist' LIMIT 1),
 'Ho Chi Minh City', 'Hanoi', 1726, 1800),

((SELECT operator_id FROM operators WHERE name = 'The Sinh Tourist' LIMIT 1),
 'Ho Chi Minh City', 'Da Nang', 964, 900),

((SELECT operator_id FROM operators WHERE name = 'Futa Bus Lines' LIMIT 1),
 'Hanoi', 'Da Nang', 764, 720)
ON CONFLICT DO NOTHING;

-- 6. Route Stops
INSERT INTO route_stops (route_id, stop_name, stop_order, distance_from_start, estimated_time) VALUES
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 'Ho Chi Minh City', 1, 0, 0),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 'Da Nang', 2, 964, 540),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 'Hanoi', 3, 1726, 1080)
ON CONFLICT DO NOTHING;

-- 7. Trips
INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, policies, status) VALUES
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '51A-12345' LIMIT 1),
 '2024-01-20 08:00:00', '2024-01-20 14:00:00', 500000, '{"refund": "24h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Nang' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '30A-67890' LIMIT 1),
 '2024-01-20 10:00:00', '2024-01-20 18:00:00', 350000, '{"refund": "12h", "changes": "allowed"}', 'active'),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Da Nang' LIMIT 1),
 (SELECT bus_id FROM buses WHERE license_plate = '29A-54321' LIMIT 1),
 '2024-01-21 06:00:00', '2024-01-21 12:00:00', 250000, '{"refund": "24h", "changes": "not_allowed"}', 'active')
ON CONFLICT DO NOTHING;