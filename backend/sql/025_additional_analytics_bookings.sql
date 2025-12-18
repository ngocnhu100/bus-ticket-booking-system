-- =====================================================
-- ADDITIONAL BOOKING DATA FOR ANALYTICS (Last 7 Days)
-- Creates realistic booking data from Dec 11-18, 2025
-- Run this after the comprehensive seed data is loaded
-- =====================================================

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_ref(date_val DATE, seq INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
    RETURN 'BK' || TO_CHAR(date_val, 'YYYYMMDD') || LPAD(seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Get some trip IDs for booking (assign sequentially, cycling through available trips)
CREATE TEMP TABLE temp_trips AS
SELECT trip_id, route_id, departure_time, base_price,
       ROW_NUMBER() OVER (ORDER BY trip_id) as trip_order
FROM trips
ORDER BY trip_id;

-- Insert bookings for the last 7 days with various statuses
INSERT INTO bookings (
    booking_reference, trip_id, user_id, contact_email, contact_phone,
    status, subtotal, service_fee, total_price, currency,
    payment_method, payment_status, paid_at, created_at, updated_at
) VALUES
-- December 18, 2025 (Today) - Mix of statuses
(generate_booking_ref('2025-12-18', 1),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 1),
 (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
 'passenger@bus-ticket.com', '+84987654321', 'confirmed', 500000, 25000, 525000, 'VND',
 'momo', 'paid', '2025-12-18 08:30:00+07', '2025-12-18 08:15:00+07', '2025-12-18 08:30:00+07'),

(generate_booking_ref('2025-12-18', 2),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 2),
 (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
 'google.user@bus-ticket.com', '+84111222333', 'confirmed', 480000, 24000, 504000, 'VND',
 'zalopay', 'paid', '2025-12-18 09:45:00+07', '2025-12-18 09:30:00+07', '2025-12-18 09:45:00+07'),

(generate_booking_ref('2025-12-18', 3),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 3),
 NULL, 'guest@example.com', '+84998877665', 'pending', 350000, 17500, 367500, 'VND',
 NULL, 'unpaid', NULL, '2025-12-18 10:20:00+07', '2025-12-18 10:20:00+07'),

(generate_booking_ref('2025-12-18', 4),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 4),
 (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
 'passenger@bus-ticket.com', '+84987654321', 'cancelled', 520000, 26000, 546000, 'VND',
 'momo', 'refunded', '2025-12-18 11:00:00+07', '2025-12-18 10:45:00+07', '2025-12-18 11:15:00+07'),

-- December 17, 2025 - More bookings
(generate_booking_ref('2025-12-17', 1),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 5),
 (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
 'admin@bus-ticket.com', '+84123456789', 'confirmed', 450000, 22500, 472500, 'VND',
 'card', 'paid', '2025-12-17 14:20:00+07', '2025-12-17 14:00:00+07', '2025-12-17 14:20:00+07'),

(generate_booking_ref('2025-12-17', 2),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 6),
 NULL, 'customer1@email.com', '+84991112233', 'confirmed', 320000, 16000, 336000, 'VND',
 'momo', 'paid', '2025-12-17 15:30:00+07', '2025-12-17 15:15:00+07', '2025-12-17 15:30:00+07'),

(generate_booking_ref('2025-12-17', 3),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 7),
 (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
 'google.user@bus-ticket.com', '+84111222333', 'confirmed', 380000, 19000, 399000, 'VND',
 'zalopay', 'paid', '2025-12-17 16:45:00+07', '2025-12-17 16:30:00+07', '2025-12-17 16:45:00+07'),

(generate_booking_ref('2025-12-17', 4),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 8),
 NULL, 'traveler@example.com', '+84997776655', 'cancelled', 410000, 20500, 430500, 'VND',
 'momo', 'refunded', '2025-12-17 17:30:00+07', '2025-12-17 17:00:00+07', '2025-12-17 17:45:00+07'),

(generate_booking_ref('2025-12-17', 5),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 9),
 (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
 'passenger@bus-ticket.com', '+84987654321', 'confirmed', 550000, 27500, 577500, 'VND',
 'card', 'paid', '2025-12-17 18:15:00+07', '2025-12-17 18:00:00+07', '2025-12-17 18:15:00+07'),

-- December 16, 2025 - High volume day
(generate_booking_ref('2025-12-16', 1),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 10),
 NULL, 'weekend@example.com', '+84995554433', 'confirmed', 480000, 24000, 504000, 'VND',
 'zalopay', 'paid', '2025-12-16 09:00:00+07', '2025-12-16 08:45:00+07', '2025-12-16 09:00:00+07'),

(generate_booking_ref('2025-12-16', 2),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 11),
 (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
 'google.user@bus-ticket.com', '+84111222333', 'confirmed', 520000, 26000, 546000, 'VND',
 'momo', 'paid', '2025-12-16 10:30:00+07', '2025-12-16 10:15:00+07', '2025-12-16 10:30:00+07'),

(generate_booking_ref('2025-12-16', 3),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 12),
 (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
 'admin@bus-ticket.com', '+84123456789', 'confirmed', 350000, 17500, 367500, 'VND',
 'card', 'paid', '2025-12-16 11:45:00+07', '2025-12-16 11:30:00+07', '2025-12-16 11:45:00+07'),

(generate_booking_ref('2025-12-16', 4),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 13),
 NULL, 'business@email.com', '+84992223344', 'pending', 600000, 30000, 630000, 'VND',
 NULL, 'unpaid', NULL, '2025-12-16 12:20:00+07', '2025-12-16 12:20:00+07'),

(generate_booking_ref('2025-12-16', 5),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 14),
 (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
 'passenger@bus-ticket.com', '+84987654321', 'confirmed', 420000, 21000, 441000, 'VND',
 'momo', 'paid', '2025-12-16 13:15:00+07', '2025-12-16 13:00:00+07', '2025-12-16 13:15:00+07'),

(generate_booking_ref('2025-12-16', 6),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 15),
 NULL, 'cancelled@example.com', '+84996667788', 'cancelled', 380000, 19000, 399000, 'VND',
 'zalopay', 'refunded', '2025-12-16 14:00:00+07', '2025-12-16 13:45:00+07', '2025-12-16 14:15:00+07'),

-- December 15, 2025 - Mixed statuses
(generate_booking_ref('2025-12-15', 1),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 1),
 (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
 'google.user@bus-ticket.com', '+84111222333', 'confirmed', 450000, 22500, 472500, 'VND',
 'card', 'paid', '2025-12-15 08:30:00+07', '2025-12-15 08:15:00+07', '2025-12-15 08:30:00+07'),

(generate_booking_ref('2025-12-15', 2),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 2),
 NULL, 'family@email.com', '+84993334455', 'confirmed', 320000, 16000, 336000, 'VND',
 'momo', 'paid', '2025-12-15 09:45:00+07', '2025-12-15 09:30:00+07', '2025-12-15 09:45:00+07'),

(generate_booking_ref('2025-12-15', 3),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 3),
 (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
 'passenger@bus-ticket.com', '+84987654321', 'cancelled', 510000, 25500, 535500, 'VND',
 'momo', 'refunded', '2025-12-15 10:30:00+07', '2025-12-15 10:15:00+07', '2025-12-15 10:45:00+07'),

-- December 14, 2025 - Weekend travel
(generate_booking_ref('2025-12-14', 1),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 4),
 NULL, 'weekend1@email.com', '+84994445566', 'confirmed', 480000, 24000, 504000, 'VND',
 'zalopay', 'paid', '2025-12-14 07:00:00+07', '2025-12-14 06:45:00+07', '2025-12-14 07:00:00+07'),

(generate_booking_ref('2025-12-14', 2),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 5),
 (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
 'admin@bus-ticket.com', '+84123456789', 'confirmed', 350000, 17500, 367500, 'VND',
 'card', 'paid', '2025-12-14 08:15:00+07', '2025-12-14 08:00:00+07', '2025-12-14 08:15:00+07'),

(generate_booking_ref('2025-12-14', 3),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 6),
 (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
 'google.user@bus-ticket.com', '+84111222333', 'confirmed', 420000, 21000, 441000, 'VND',
 'momo', 'paid', '2025-12-14 09:30:00+07', '2025-12-14 09:15:00+07', '2025-12-14 09:30:00+07'),

-- December 13, 2025 - Business travel
(generate_booking_ref('2025-12-13', 1),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 7),
 (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
 'passenger@bus-ticket.com', '+84987654321', 'confirmed', 550000, 27500, 577500, 'VND',
 'card', 'paid', '2025-12-13 06:00:00+07', '2025-12-13 05:45:00+07', '2025-12-13 06:00:00+07'),

(generate_booking_ref('2025-12-13', 2),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 8),
 NULL, 'business1@email.com', '+84997778899', 'confirmed', 480000, 24000, 504000, 'VND',
 'zalopay', 'paid', '2025-12-13 07:30:00+07', '2025-12-13 07:15:00+07', '2025-12-13 07:30:00+07'),

-- December 12, 2025 - Light day
(generate_booking_ref('2025-12-12', 1),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 9),
 (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
 'google.user@bus-ticket.com', '+84111222333', 'confirmed', 380000, 19000, 399000, 'VND',
 'momo', 'paid', '2025-12-12 10:00:00+07', '2025-12-12 09:45:00+07', '2025-12-12 10:00:00+07'),

(generate_booking_ref('2025-12-12', 2),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 10),
 NULL, 'light@email.com', '+84996665544', 'pending', 420000, 21000, 441000, 'VND',
 NULL, 'unpaid', NULL, '2025-12-12 11:20:00+07', '2025-12-12 11:20:00+07'),

-- December 11, 2025 - Start of the week
(generate_booking_ref('2025-12-11', 1),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 11),
 (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
 'passenger@bus-ticket.com', '+84987654321', 'confirmed', 450000, 22500, 472500, 'VND',
 'momo', 'paid', '2025-12-11 08:00:00+07', '2025-12-11 07:45:00+07', '2025-12-11 08:00:00+07'),

(generate_booking_ref('2025-12-11', 2),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 12),
 (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
 'admin@bus-ticket.com', '+84123456789', 'confirmed', 320000, 16000, 336000, 'VND',
 'card', 'paid', '2025-12-11 09:15:00+07', '2025-12-11 09:00:00+07', '2025-12-11 09:15:00+07'),

(generate_booking_ref('2025-12-11', 3),
 (SELECT trip_id FROM temp_trips WHERE trip_order = 13),
 NULL, 'startweek@email.com', '+84995556677', 'cancelled', 510000, 25500, 535500, 'VND',
 'zalopay', 'refunded', '2025-12-11 10:00:00+07', '2025-12-11 09:45:00+07', '2025-12-11 10:15:00+07');

-- Clean up temp table
DROP TABLE temp_trips;

-- Update cancellation info for cancelled bookings
UPDATE bookings
SET cancellation_reason = 'Customer request',
    refund_amount = total_price
WHERE status = 'cancelled' AND refund_amount IS NULL;

-- Mark some bookings as completed (for past trips)
UPDATE bookings
SET status = 'completed'
WHERE status = 'confirmed'
  AND trip_id IN (
    SELECT trip_id FROM trips
    WHERE departure_time < CURRENT_TIMESTAMP - INTERVAL '2 hours'
  )
  AND created_at < CURRENT_TIMESTAMP - INTERVAL '2 hours';

-- Add some passenger details for the bookings (optional)
INSERT INTO booking_passengers (
    booking_id, seat_code, price, full_name, phone, document_id
) VALUES
-- Add passengers for some of the bookings
((SELECT booking_id FROM bookings WHERE booking_reference = 'BK20251218001' LIMIT 1),
 '1A', 500000, 'Nguyen Van A', '+84987654321', '123456789'),

((SELECT booking_id FROM bookings WHERE booking_reference = 'BK20251218002' LIMIT 1),
 '2B', 480000, 'Tran Thi B', '+84111222333', '987654321'),

((SELECT booking_id FROM bookings WHERE booking_reference = 'BK20251217001' LIMIT 1),
 'VIP1A', 350000, 'Le Van C', '+84123456789', '456789123'),

((SELECT booking_id FROM bookings WHERE booking_reference = 'BK20251217002' LIMIT 1),
 '3C', 520000, 'Pham Thi D', '+84991112233', '789123456'),

((SELECT booking_id FROM bookings WHERE booking_reference = 'BK20251216001' LIMIT 1),
 '4A', 350000, 'Hoang Van E', '+84995554433', '321654987');

-- Display summary of inserted data
SELECT
    DATE(created_at) as booking_date,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    SUM(total_price) as total_revenue
FROM bookings
WHERE created_at >= '2025-12-11'
GROUP BY DATE(created_at)
ORDER BY booking_date DESC;