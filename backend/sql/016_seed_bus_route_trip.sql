-- =====================================================
-- FULL SEED DATA – KEEP bus_models + seat_layouts
-- Run once after all migrations are complete
-- =====================================================

-- 1. bus_models + seat_layouts (important for seat selection)
INSERT INTO bus_models (name, total_seats) VALUES
('Hyundai Universe 45 seated', 45),
('Thaco Mobihome 34 double sleepers', 34),
('Samco Isuzu Limousine 29 seats', 29),
('Tracomeco Highlander 38 sleepers', 38),
('Fuso Rosa 22 seated', 22),
('Mercedes Sprinter 16 seats', 16),
('Volvo 50 seated', 50)
ON CONFLICT (name) DO NOTHING;

-- Sample layouts for common models
INSERT INTO seat_layouts (bus_model_id, layout_json) VALUES
-- Hyundai Universe 45 (2-2 + last row 5)
((SELECT bus_model_id FROM bus_models WHERE name LIKE '%45 seated%'),
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

-- Thaco Mobihome 34 double sleepers (2 floors)
((SELECT bus_model_id FROM bus_models WHERE name LIKE '%34 double sleepers%'),
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

-- Samco Isuzu Limousine 29 (2-1 VIP)
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

-- 2. operators (add logo_url)
INSERT INTO operators (name, contact_email, contact_phone, status, rating, logo_url) VALUES
('GreenLine Express', 'greenline@bus.com', '19001001', 'approved', 4.6, 'https://example.com/greenline-logo.png'),
('Future Travel Bus Co', 'futuretravel@bus.com', '19002002', 'approved', 4.3, 'https://example.com/future-logo.png'),
('Kumho Samco Buslines', 'kumho@bus.com', '19003003', 'approved', 4.1, 'https://example.com/kumho-logo.png'),
('Sunrise Coaches', 'sunrise@bus.com', '19004004', 'approved', 4.0, 'https://example.com/sunrise-logo.png')
ON CONFLICT (contact_email) DO NOTHING;

-- 3. buses
INSERT INTO buses (operator_id, bus_model_id, license_plate, plate_number, amenities, status) VALUES
((SELECT operator_id FROM operators WHERE name = 'GreenLine Express'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%45 seated%'), '51G-123.45', '123.45', '["wifi","tv","blanket"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Future Travel Bus Co'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%34 double sleepers%'), '51F-999.99', '999.99', '["wifi","toilet","snack"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Kumho Samco Buslines'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%Limousine 29%'), '51K-777.77', '777.77', '["wifi","tv","snack","leather","massage"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'Sunrise Coaches'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%16 seats%'), '51S-555.55', '555.55', '["aircon","usb"]', 'active'),

((SELECT operator_id FROM operators WHERE name = 'GreenLine Express'),
 (SELECT bus_model_id FROM bus_models WHERE name LIKE '%50 seated%'), '51G-050.50', '050.50', '["wifi","tv","recliner"]', 'active')
ON CONFLICT (license_plate) DO NOTHING;

-- 4. routes (city names in English)
INSERT INTO routes (operator_id, origin, destination, distance_km, estimated_minutes) VALUES
((SELECT operator_id FROM operators WHERE name = 'GreenLine Express'), 'Ho Chi Minh City', 'Da Lat', 300, 420),
((SELECT operator_id FROM operators WHERE name = 'Future Travel Bus Co'), 'Ho Chi Minh City', 'Nha Trang', 450, 540),
((SELECT operator_id FROM operators WHERE name = 'Kumho Samco Buslines'), 'Ho Chi Minh City', 'Can Tho', 170, 240),
((SELECT operator_id FROM operators WHERE name = 'Sunrise Coaches'), 'Hanoi', 'Sapa', 320, 360),
((SELECT operator_id FROM operators WHERE name = 'GreenLine Express'), 'Ho Chi Minh City', 'Bao Loc', 200, 270),
((SELECT operator_id FROM operators WHERE name = 'Future Travel Bus Co'), 'Da Nang', 'Hue', 100, 120),
((SELECT operator_id FROM operators WHERE name = 'Kumho Samco Buslines'), 'Hanoi', 'Ha Long', 170, 210)
ON CONFLICT DO NOTHING;

-- 5. route_stops (sample for Ho Chi Minh City -> Da Lat)
INSERT INTO route_stops (
    route_id,
    stop_name,
    address,
    arrival_offset_minutes,
    departure_offset_minutes,
    sequence
) VALUES
-- Ho Chi Minh City → Da Lat
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Lat'),
    'Mien Dong Bus Station', '292 Dinh Bo Linh, Binh Thanh', 0, 0, 1),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Lat'),
    'Thai Phien Junction (Bao Loc)', 'Bao Loc, Lam Dong', 180, 180, 2),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Lat'),
    'Da Lat Interprovincial Station', '1 To Hien Thanh, Da Lat', 420, 420, 3),

-- Ho Chi Minh City → Nha Trang
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Nha Trang'),
    'Mien Tay Bus Station', 'Ho Chi Minh City', 0, 0, 1),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Nha Trang'),
    'Nha Trang Central Station', 'Nha Trang City Center', 450, 450, 2),

-- Hanoi → Sapa
((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Sapa'),
    'My Dinh Bus Station', 'My Dinh, Hanoi', 0, 0, 1),

((SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Sapa'),
    'Sapa Bus Terminal', 'Sapa Town', 360, 360, 2)
ON CONFLICT DO NOTHING;

-- 6. trips (with policies, status 'active') - expanded with future dates
INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, policies, status) VALUES
-- HCMC -> Da Lat daytime (multiple trips for testing)
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Lat'),
 (SELECT bus_id FROM buses WHERE license_plate = '51G-123.45'),
 '2026-01-15 08:00:00', '2026-01-15 15:00:00', 350000.00, '{"cancellation_policy": "24h free", "modification_policy": "Flexible", "refund_policy": "Full"}'::jsonb, 'active'),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Lat'),
 (SELECT bus_id FROM buses WHERE license_plate = '51G-123.45'),
 '2026-01-16 08:00:00', '2026-01-16 15:00:00', 350000.00, '{"cancellation_policy": "24h free", "modification_policy": "Flexible", "refund_policy": "Full"}'::jsonb, 'active'),

-- HCMC -> Da Lat night sleeper
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Lat'),
 (SELECT bus_id FROM buses WHERE license_plate = '51F-999.99'),
 '2026-01-15 22:00:00', '2026-01-16 05:30:00', 520000.00, '{"cancellation_policy": "48h partial", "modification_policy": "Limited", "refund_policy": "Partial"}'::jsonb, 'active'),

-- HCMC -> Nha Trang (multiple trips)
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Nha Trang'),
 (SELECT bus_id FROM buses WHERE license_plate = '51K-777.77'),
 '2026-01-15 20:30:00', '2026-01-16 05:00:00', 480000.00, '{"cancellation_policy": "24h free", "modification_policy": "Flexible", "refund_policy": "Full"}'::jsonb, 'active'),

((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Nha Trang'),
 (SELECT bus_id FROM buses WHERE license_plate = '51K-777.77'),
 '2026-01-20 20:30:00', '2026-01-21 05:00:00', 480000.00, '{"cancellation_policy": "24h free", "modification_policy": "Flexible", "refund_policy": "Full"}'::jsonb, 'active'),

-- HCMC -> Can Tho
((SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Can Tho'),
 (SELECT bus_id FROM buses WHERE license_plate = '51S-555.55'),
 '2026-01-15 07:00:00', '2026-01-15 11:00:00', 180000.00, '{"cancellation_policy": "12h free", "modification_policy": "Flexible", "refund_policy": "Full"}'::jsonb, 'active'),

-- Da Nang -> Hue
((SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Hue'),
 (SELECT bus_id FROM buses WHERE license_plate = '51G-050.50'),
 '2026-01-20 09:00:00', '2026-01-20 11:00:00', 120000.00, '{"cancellation_policy": "6h free", "modification_policy": "Flexible", "refund_policy": "Full"}'::jsonb, 'active')
ON CONFLICT DO NOTHING;

-- =========================================================
-- Additional trips for routes that need more coverage
INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, policies, status)
VALUES
-- Hanoi -> Ha Long (day trip)
(
  (SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ha Long'),
  (SELECT bus_id FROM buses WHERE license_plate = '51G-050.50' LIMIT 1),
  '2026-01-18 07:00:00', '2026-01-18 11:00:00', 200000.00,
  '{"cancellation_policy":"24h free","modification_policy":"Flexible","refund_policy":"Full"}'::jsonb,
  'active'
),
-- Hanoi -> Sapa (overnight sleeper)
(
  (SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Sapa'),
  (SELECT bus_id FROM buses WHERE license_plate = '51F-999.99' LIMIT 1),
  '2026-01-19 20:00:00', '2026-01-20 04:00:00', 300000.00,
  '{"cancellation_policy":"48h partial","modification_policy":"Limited","refund_policy":"Partial"}'::jsonb,
  'active'
),
-- Ho Chi Minh City -> Bao Loc (day)
(
  (SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Bao Loc'),
  (SELECT bus_id FROM buses WHERE license_plate = '51G-123.45' LIMIT 1),
  '2026-01-22 08:00:00', '2026-01-22 12:30:00', 250000.00,
  '{"cancellation_policy":"24h free","modification_policy":"Flexible","refund_policy":"Full"}'::jsonb,
  'active'
)
ON CONFLICT DO NOTHING;

-- 7. seats (fixed seats per bus – required for bookings)
WITH buses_data AS (
  SELECT b.bus_id, b.bus_model_id,
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

-- =========================================================
-- SEED DATA: SAMPLE BOOKINGS (with proper schema)
-- =========================================================

-- First, let's insert bookings without the CTE complexity
DO $$
DECLARE
  v_trip_dalat_day UUID;
  v_trip_dalat_night UUID;
  v_trip_nhatrang UUID;
  v_trip_cantho UUID;
  v_user_id UUID;
  v_booking1_id UUID;
  v_booking2_id UUID;
  v_booking3_id UUID;
  v_booking4_id UUID;
  v_booking5_id UUID;
BEGIN
  -- Get trip IDs
  SELECT t.trip_id INTO v_trip_dalat_day
  FROM trips t
  JOIN buses b ON t.bus_id = b.bus_id
  WHERE b.license_plate = '51G-123.45'
    AND t.departure_time = '2026-01-15 08:00:00'
  LIMIT 1;

  SELECT t.trip_id INTO v_trip_dalat_night
  FROM trips t
  JOIN buses b ON t.bus_id = b.bus_id
  WHERE b.license_plate = '51F-999.99'
    AND t.departure_time = '2026-01-15 22:00:00'
  LIMIT 1;

  SELECT t.trip_id INTO v_trip_nhatrang
  FROM trips t
  JOIN buses b ON t.bus_id = b.bus_id
  WHERE b.license_plate = '51K-777.77'
    AND t.departure_time = '2026-01-15 20:30:00'
  LIMIT 1;

  SELECT t.trip_id INTO v_trip_cantho
  FROM trips t
  JOIN buses b ON t.bus_id = b.bus_id
  WHERE b.license_plate = '51S-555.55'
    AND t.departure_time = '2026-01-15 07:00:00'
  LIMIT 1;

  -- Get a test user (use passenger@bus-ticket.com which exists in 005_seed_users.sql)
  SELECT user_id INTO v_user_id
  FROM users 
  WHERE email = 'passenger@bus-ticket.com'  -- ✅ FIXED: Use existing user
  LIMIT 1;
  
  -- Verify user exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Test user not found. Please run 005_seed_users.sql first.';
  END IF;

  -- Insert Booking 1: Confirmed (Da Lat daytime) - 2 seats
  v_booking1_id := uuid_generate_v4();
  INSERT INTO bookings (
      booking_id, booking_reference, trip_id, user_id,
      contact_email, contact_phone, status, locked_until,
      subtotal, service_fee, total_price, currency,
      payment_method, payment_status, paid_at, 
      ticket_url, qr_code_url
  ) VALUES (
      v_booking1_id, 'BK20260115001', v_trip_dalat_day, v_user_id,
      'john.doe@example.com', '0901234567', 'confirmed', NULL,
      700000, 20000, 720000, 'VND',
      'momo', 'paid', NOW() - INTERVAL '1 day', 
      'https://cdn.example.com/tickets/bk20260115001.pdf',
      'https://cdn.example.com/qr/bk20260115001.png'
  );

  -- Insert passengers for Booking 1
  INSERT INTO booking_passengers (booking_id, seat_code, price, full_name, phone, document_id)
  VALUES
    (v_booking1_id, 'A1', 350000, 'John Doe', '0901234567', '079012345678'),
    (v_booking1_id, 'A2', 350000, 'Mary Doe', '0901234568', '079087654321');

  -- Insert Booking 2: Pending (Nha Trang) - 1 seat
  v_booking2_id := uuid_generate_v4();
  INSERT INTO bookings (
      booking_id, booking_reference, trip_id, user_id,
      contact_email, contact_phone, status, locked_until,
      subtotal, service_fee, total_price, currency,
      payment_method, payment_status, paid_at, 
      ticket_url, qr_code_url
  ) VALUES (
      v_booking2_id, 'BK20260115002', v_trip_nhatrang, v_user_id,
      'jane.smith@example.com', '0909887777', 'pending', NOW() + INTERVAL '8 minutes',
      480000, 10000, 490000, 'VND',
      NULL, 'unpaid', NULL, 
      NULL, NULL
  );

  -- Insert passenger for Booking 2
  INSERT INTO booking_passengers (booking_id, seat_code, price, full_name, phone, document_id)
  VALUES
    (v_booking2_id, 'A1', 480000, 'Jane Smith', '0909887777', '079098765432');

  -- Insert Booking 3: Cancelled (Da Lat night) - 1 seat
  v_booking3_id := uuid_generate_v4();
  INSERT INTO bookings (
      booking_id, booking_reference, trip_id, user_id,
      contact_email, contact_phone, status, locked_until,
      subtotal, service_fee, total_price, currency,
      payment_method, payment_status, paid_at,
      cancellation_reason, refund_amount,
      ticket_url, qr_code_url
  ) VALUES (
      v_booking3_id, 'BK20260115003', v_trip_dalat_night, v_user_id,
      'canceled.user@example.com', '0905555555', 'cancelled', NULL,
      520000, 10000, 530000, 'VND',
      'credit_card', 'refunded', NOW() - INTERVAL '2 days',
      'User requested cancellation', 424000,
      NULL, NULL
  );

  -- Insert passenger for Booking 3
  INSERT INTO booking_passengers (booking_id, seat_code, price, full_name, phone, document_id)
  VALUES
    (v_booking3_id, 'A5', 520000, 'Canceled User', '0905555555', '079055555555');

  -- Insert Booking 4: Confirmed (Can Tho) - group booking 4 seats
  v_booking4_id := uuid_generate_v4();
  INSERT INTO bookings (
      booking_id, booking_reference, trip_id, user_id,
      contact_email, contact_phone, status, locked_until,
      subtotal, service_fee, total_price, currency,
      payment_method, payment_status, paid_at, 
      ticket_url, qr_code_url
  ) VALUES (
      v_booking4_id, 'BK20260115004', v_trip_cantho, v_user_id,
      'group.leader@example.com', '0901112233', 'confirmed', NULL,
      720000, 40000, 760000, 'VND',
      'credit_card', 'paid', NOW() - INTERVAL '3 hours', 
      'https://cdn.example.com/tickets/bk20260115004.pdf',
      'https://cdn.example.com/qr/bk20260115004.png'
  );

  -- Insert passengers for Booking 4
  INSERT INTO booking_passengers (booking_id, seat_code, price, full_name, phone, document_id)
  VALUES
    (v_booking4_id, 'A1', 180000, 'Group Member One', '0901112234', '079011111111'),
    (v_booking4_id, 'A2', 180000, 'Group Member Two', '0901112235', '079022222222'),
    (v_booking4_id, 'A3', 180000, 'Group Member Three', '0901112236', '079033333333'),
    (v_booking4_id, 'A4', 180000, 'Group Member Four', '0901112237', '079044444444');

  -- Insert Booking 5: Pending - guest booking
  v_booking5_id := uuid_generate_v4();
  INSERT INTO bookings (
      booking_id, booking_reference, trip_id, user_id,
      contact_email, contact_phone, status, locked_until,
      subtotal, service_fee, total_price, currency,
      payment_method, payment_status, paid_at, 
      ticket_url, qr_code_url
  ) VALUES (
      v_booking5_id, 'BK20260115005', v_trip_dalat_day, NULL,
      'guest.user@example.com', '0903334455', 'pending', NOW() + INTERVAL '2 minutes',
      350000, 15000, 365000, 'VND',
      NULL, 'unpaid', NULL, 
      NULL, NULL
  );

  -- Insert passenger for Booking 5
  INSERT INTO booking_passengers (booking_id, seat_code, price, full_name, phone, document_id)
  VALUES
    (v_booking5_id, 'A10', 350000, 'Guest User', '0903334455', '079055566677');

END $$;
