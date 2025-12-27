-- =====================================================
-- SEED RATINGS DATA
-- Sample ratings and reviews for testing
-- =====================================================

-- Insert sample ratings for completed bookings that exist
DO $$
DECLARE
    booking_record RECORD;
    trip_record RECORD;
    operator_record RECORD;
    user_record RECORD;
    counter INTEGER := 0;
BEGIN
    -- Loop through existing bookings with users and create ratings
    FOR booking_record IN
        SELECT b.booking_id, b.user_id, t.trip_id, bus.operator_id
        FROM bookings b
        JOIN trips t ON b.trip_id = t.trip_id
        JOIN routes r ON t.route_id = r.route_id
        JOIN buses bus ON t.bus_id = bus.bus_id
        WHERE b.user_id IS NOT NULL
        AND b.status = 'confirmed'
        ORDER BY b.created_at DESC
        LIMIT 10
    LOOP
        counter := counter + 1;

        -- Insert rating based on counter
        IF counter = 1 THEN
            INSERT INTO ratings (
                booking_id, trip_id, operator_id, user_id,
                overall_rating, cleanliness_rating, driver_behavior_rating,
                punctuality_rating, comfort_rating, value_for_money_rating,
                review_text, photos, is_flagged, flag_reason, is_approved,
                helpful_count, unhelpful_count
            ) VALUES (
                booking_record.booking_id, booking_record.trip_id, booking_record.operator_id, booking_record.user_id,
                5, 5, 5, 5, 5, 5,
                'Excellent service! The bus was clean, driver was professional, and we arrived exactly on time. Highly recommend!',
                '["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]',
                FALSE, NULL, TRUE, 12, 1
            );
        ELSIF counter = 2 THEN
            INSERT INTO ratings (
                booking_id, trip_id, operator_id, user_id,
                overall_rating, cleanliness_rating, driver_behavior_rating,
                punctuality_rating, comfort_rating, value_for_money_rating,
                review_text, photos, is_flagged, flag_reason, is_approved,
                helpful_count, unhelpful_count
            ) VALUES (
                booking_record.booking_id, booking_record.trip_id, booking_record.operator_id, booking_record.user_id,
                4, 4, 4, 5, 4, 4,
                'Good trip overall. Bus was comfortable and clean. Driver was courteous. Only minor delay but still arrived within acceptable time.',
                '[]', FALSE, NULL, TRUE, 8, 0
            );
        ELSIF counter = 3 THEN
            INSERT INTO ratings (
                booking_id, trip_id, operator_id, user_id,
                overall_rating, cleanliness_rating, driver_behavior_rating,
                punctuality_rating, comfort_rating, value_for_money_rating,
                review_text, photos, is_flagged, flag_reason, is_approved,
                helpful_count, unhelpful_count
            ) VALUES (
                booking_record.booking_id, booking_record.trip_id, booking_record.operator_id, booking_record.user_id,
                3, 3, 2, 4, 3, 3,
                NULL,
                '["https://example.com/photo3.jpg"]',
                FALSE, NULL, TRUE, 3, 2
            );
        ELSIF counter = 4 THEN
            INSERT INTO ratings (
                booking_id, trip_id, operator_id, user_id,
                overall_rating, cleanliness_rating, driver_behavior_rating,
                punctuality_rating, comfort_rating, value_for_money_rating,
                review_text, photos, is_flagged, flag_reason, is_approved,
                helpful_count, unhelpful_count
            ) VALUES (
                booking_record.booking_id, booking_record.trip_id, booking_record.operator_id, booking_record.user_id,
                2, 1, 3, 2, 2, 1,
                'Terrible experience! Bus was filthy, arrived 2 hours late, and the driver was rude. Never again!',
                '["https://example.com/photo4.jpg", "https://example.com/photo5.jpg", "https://example.com/photo6.jpg"]',
                TRUE, 'Inappropriate language in review', TRUE, 1, 5
            );
        ELSIF counter = 5 THEN
            INSERT INTO ratings (
                booking_id, trip_id, operator_id, user_id,
                overall_rating, cleanliness_rating, driver_behavior_rating,
                punctuality_rating, comfort_rating, value_for_money_rating,
                review_text, photos, is_flagged, flag_reason, is_approved,
                helpful_count, unhelpful_count
            ) VALUES (
                booking_record.booking_id, booking_record.trip_id, booking_record.operator_id, booking_record.user_id,
                5, 5, 5, 5, 5, 5,
                'Perfect sleeper bus experience! Comfortable bed, quiet environment, and arrived right on time. Will definitely book again.',
                '[]', FALSE, NULL, TRUE, 15, 0
            );
        END IF;

        -- Exit after 5 ratings to avoid too many
        IF counter >= 5 THEN
            EXIT;
        END IF;
    END LOOP;

    RAISE NOTICE 'Inserted % ratings', counter;
END $$;

-- Insert additional sample ratings
INSERT INTO ratings (
    booking_id, trip_id, operator_id, user_id,
    overall_rating, cleanliness_rating, driver_behavior_rating,
    punctuality_rating, comfort_rating, value_for_money_rating,
    review_text, photos, is_flagged, flag_reason, is_approved,
    helpful_count, unhelpful_count
) VALUES
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 3),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 5),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 2),
    (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
    3, 3, 3, 3, 3, 3,
    'Standard service. Nothing to complain about, nothing to rave about.',
    '[]',
    FALSE, NULL, TRUE, 4, 2
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 4),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 6),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 3),
    (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
    5, 5, 5, 5, 5, 5,
    'Amazing customer service! The staff remembered me from previous trips and made me feel welcome.',
    '[]',
    FALSE, NULL, TRUE, 14, 0
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 5),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 7),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 0),
    (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
    4, 4, 4, 4, 4, 4,
    'Good overall experience. The onboard WiFi was a nice touch.',
    '[]',
    FALSE, NULL, TRUE, 7, 1
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 6),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 0),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 1),
    (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
    2, 2, 2, 2, 2, 2,
    'Below average. The bus was dirty and the air conditioning wasn''t working properly.',
    '["https://example.com/photo16.jpg"]',
    FALSE, NULL, TRUE, 2, 6
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 7),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 1),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 2),
    (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
    5, 5, 5, 5, 5, 5,
    'Exceptional service from start to finish. Will definitely be a repeat customer!',
    '["https://example.com/photo17.jpg"]',
    FALSE, NULL, TRUE, 19, 0
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 8),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 2),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 3),
    (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
    4, 4, 4, 4, 4, 4,
    'Professional and efficient. Everything ran like clockwork.',
    '[]',
    FALSE, NULL, TRUE, 12, 1
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 9),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 3),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 0),
    (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
    3, 3, 3, 3, 3, 3,
    'Acceptable service. Met basic expectations but room for improvement.',
    '[]',
    FALSE, NULL, TRUE, 3, 2
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 10),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 4),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 1),
    (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
    5, 5, 5, 5, 5, 5,
    'Outstanding attention to detail. Every aspect of the journey was well thought out.',
    '["https://example.com/photo18.jpg", "https://example.com/photo19.jpg"]',
    FALSE, NULL, TRUE, 21, 0
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET (29 % 29)),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 5),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 2),
    (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
    4, 4, 4, 4, 4, 4,
    'Solid performance across all categories. A dependable choice.',
    '[]',
    FALSE, NULL, TRUE, 9, 1
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET (30 % 29)),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 6),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 3),
    (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
    2, 2, 2, 2, 2, 2,
    'Poor experience. Multiple issues with the vehicle and service.',
    '[]',
    FALSE, NULL, TRUE, 1, 7
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET (31 % 29)),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 7),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 0),
    (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
    5, 5, 5, 5, 5, 5,
    'Premium service that exceeds expectations. Truly world-class transportation.',
    '["https://example.com/photo20.jpg", "https://example.com/photo21.jpg", "https://example.com/photo22.jpg"]',
    FALSE, NULL, TRUE, 28, 0
)
ON CONFLICT (booking_id) DO NOTHING;

-- Insert sample rating votes
INSERT INTO rating_votes (rating_id, user_id, is_helpful)
SELECT r.rating_id, u1.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Highly recommend!' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1) u1
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u2.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Highly recommend!' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1) u2
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u3.user_id, FALSE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Highly recommend!' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1) u3
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u4.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%minor delay%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1) u4
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u5.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%minor delay%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1) u5
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u6.user_id, FALSE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Never again!' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1) u6
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u7.user_id, FALSE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Never again!' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1) u7
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u8.user_id, FALSE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Never again!' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1) u8
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u9.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Will definitely book again%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1) u9
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u10.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Will definitely book again%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1) u10
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u11.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Will definitely book again%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1) u11
WHERE r.rating_id IS NOT NULL
ON CONFLICT (rating_id, user_id) DO NOTHING;

-- Additional votes for new reviews
INSERT INTO rating_votes (rating_id, user_id, is_helpful)
SELECT r.rating_id, u1.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%ensure passenger comfort%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1) u1
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u2.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%ensure passenger comfort%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1) u2
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u3.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Slept like a baby%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1) u3
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u4.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Slept like a baby%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1) u4
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u5.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Worth every penny%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1) u5
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u6.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Worth every penny%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1) u6
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u7.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Worth every penny%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1) u7
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u8.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Truly world-class transportation%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1) u8
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u9.user_id, TRUE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Truly world-class transportation%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1) u9
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u10.user_id, FALSE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%Mechanical issues, rude staff%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1) u10
WHERE r.rating_id IS NOT NULL
UNION ALL
SELECT r.rating_id, u11.user_id, FALSE
FROM (SELECT rating_id FROM ratings WHERE review_text LIKE '%with the vehicle and service%' LIMIT 1) r
CROSS JOIN (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1) u11
WHERE r.rating_id IS NOT NULL
ON CONFLICT (rating_id, user_id) DO NOTHING;
