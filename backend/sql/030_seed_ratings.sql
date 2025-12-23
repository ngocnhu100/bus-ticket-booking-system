-- =====================================================
-- SEED RATINGS DATA
-- Sample ratings and reviews for testing
-- =====================================================

-- Insert sample ratings for completed bookings
INSERT INTO ratings (
    booking_id,
    trip_id,
    operator_id,
    user_id,
    overall_rating,
    cleanliness_rating,
    driver_behavior_rating,
    punctuality_rating,
    comfort_rating,
    value_for_money_rating,
    review_text,
    photos,
    is_flagged,
    flag_reason,
    is_approved,
    helpful_count,
    unhelpful_count
) VALUES
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 0),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 0),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 0),
    (SELECT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 0),
    5, 5, 5, 5, 5, 5,
    'Excellent service! The bus was clean, driver was professional, and we arrived exactly on time. Highly recommend!',
    '["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]',
    FALSE, NULL, TRUE, 12, 1
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 1),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 1),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 1),
    (SELECT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 1),
    4, 4, 4, 5, 4, 4,
    'Good trip overall. Bus was comfortable and clean. Driver was courteous. Only minor delay but still arrived within acceptable time.',
    '[]',
    FALSE, NULL, TRUE, 8, 0
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 2),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 2),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 2),
    (SELECT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 2),
    3, 3, 2, 4, 3, 3,
    NULL,
    '["https://example.com/photo3.jpg"]',
    FALSE, NULL, TRUE, 3, 2
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 3),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 3),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 3),
    (SELECT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 3),
    2, 1, 3, 2, 2, 1,
    'Terrible experience! Bus was filthy, arrived 2 hours late, and the driver was rude. Never again!',
    '["https://example.com/photo4.jpg", "https://example.com/photo5.jpg", "https://example.com/photo6.jpg"]',
    TRUE, 'Inappropriate language in review', TRUE, 1, 5
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 4),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 4),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 0),
    (SELECT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 4),
    5, 5, 5, 5, 5, 5,
    'Perfect sleeper bus experience! Comfortable bed, quiet environment, and arrived right on time. Will definitely book again.',
    '[]',
    FALSE, NULL, TRUE, 15, 0
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 5),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 5),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 1),
    (SELECT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 5),
    4, 4, 4, 4, 4, 4,
    NULL,
    '[]',
    FALSE, NULL, TRUE, 6, 1
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 6),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 6),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 2),
    (SELECT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 6),
    3, 4, 3, 2, 4, 3,
    'Bus was comfortable and clean, but we were delayed by traffic. Driver tried his best though.',
    '[]',
    FALSE, NULL, TRUE, 4, 3
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 7),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 7),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 3),
    (SELECT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 7),
    5, 5, 5, 5, 5, 4,
    'Quick and efficient short trip. Everything was perfect!',
    '[]',
    FALSE, NULL, TRUE, 7, 0
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 8),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 0),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 0),
    (SELECT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 8),
    4, 4, 4, 4, 4, 4,
    'Reliable service as always. The bus was well-maintained and the journey was smooth.',
    '[]',
    FALSE, NULL, TRUE, 9, 1
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 9),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 1),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 1),
    (SELECT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 9),
    3, 3, 2, 4, 3, 3,
    NULL,
    '[]',
    FALSE, NULL, TRUE, 2, 1
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 10),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 2),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 2),
    (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
    5, 5, 5, 5, 5, 5,
    'Outstanding service! The staff went above and beyond to ensure passenger comfort.',
    '["https://example.com/photo7.jpg"]',
    FALSE, NULL, TRUE, 18, 0
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 11),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 3),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 0),
    (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
    4, 4, 4, 3, 4, 4,
    NULL,
    '[]',
    FALSE, NULL, TRUE, 11, 2
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 12),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 4),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 1),
    (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
    2, 2, 1, 3, 2, 2,
    'Disappointing. The bus was old and uncomfortable. Staff seemed disinterested.',
    '[]',
    FALSE, NULL, TRUE, 1, 4
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 13),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 5),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 2),
    (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
    5, 5, 5, 5, 5, 5,
    'Exceptional night bus service. Slept like a baby! Highly recommend for long journeys.',
    '["https://example.com/photo8.jpg", "https://example.com/photo9.jpg"]',
    FALSE, NULL, TRUE, 22, 1
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 14),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 6),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 3),
    (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
    4, 4, 4, 4, 4, 4,
    'Consistent quality. This operator never disappoints.',
    '[]',
    FALSE, NULL, TRUE, 13, 0
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 15),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 7),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 0),
    (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
    3, 3, 3, 2, 3, 3,
    'Decent but could be better. The WiFi didn''t work and the seats could use updating.',
    '[]',
    FALSE, NULL, TRUE, 5, 3
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 16),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 0),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 1),
    (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
    5, 5, 5, 5, 5, 5,
    'Perfect timing and excellent customer service. The driver even helped with luggage!',
    '["https://example.com/photo10.jpg"]',
    FALSE, NULL, TRUE, 16, 0
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 17),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 1),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 2),
    (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
    4, 4, 4, 4, 4, 4,
    'Great value for money. Clean, comfortable, and punctual.',
    '[]',
    FALSE, NULL, TRUE, 8, 1
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 0),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 2),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 3),
    (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
    1, 1, 1, 1, 1, 1,
    'Worst bus experience ever. Mechanical issues, rude staff, and hours late.',
    '["https://example.com/photo11.jpg", "https://example.com/photo12.jpg"]',
    TRUE, 'Multiple complaints about service', FALSE, 0, 8
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 0),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 3),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 0),
    (SELECT user_id FROM users WHERE email = 'admin@bus-ticket.com' LIMIT 1),
    5, 5, 5, 5, 5, 5,
    'Luxury bus experience! Premium seats, refreshments, and entertainment. Worth every penny.',
    '["https://example.com/photo13.jpg", "https://example.com/photo14.jpg", "https://example.com/photo15.jpg"]',
    FALSE, NULL, TRUE, 25, 0
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 2),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 4),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 1),
    (SELECT user_id FROM users WHERE email = 'passenger@bus-ticket.com' LIMIT 1),
    4, 4, 4, 4, 4, 4,
    'Reliable transportation. Always on time and well-maintained vehicles.',
    '[]',
    FALSE, NULL, TRUE, 10, 1
),
(
    (SELECT booking_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1 OFFSET 3),
    (SELECT trip_id FROM trips LIMIT 1 OFFSET 5),
    (SELECT operator_id FROM operators LIMIT 1 OFFSET 2),
    (SELECT user_id FROM users WHERE email = 'google.user@bus-ticket.com' LIMIT 1),
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
