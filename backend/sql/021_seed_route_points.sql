-- 022_seed_route_points.sql
-- Idempotent seed for canonical route-level pickup/dropoff points (route_points)
-- These points are pickup/dropoff locations (not mid-route stops) and are placed close to origins/destinations.

-- Route: Ho Chi Minh City -> Hanoi
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1
)
-- Extra pickup near HCMC origin (office / district 1)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Ho Chi Minh City - District 1 Office', '273 Phạm Ngũ Lão, Phường Phạm Ngũ Lão, Quận 1, Thành phố Hồ Chí Minh', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Ho Chi Minh City - Mien Dong Bus Station', '292 Đinh Bộ Lĩnh, Phường 26, Bình Thạnh, Thành phố Hồ Chí Minh', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Da Nang Central Station', 'Ga Đà Nẵng, 791 Hải Phòng, Thanh Khê, Đà Nẵng', 120, 120, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 3, 'Hanoi Bus Terminal', 'Bến xe Mỹ Đình, Phạm Hùng, Nam Từ Liêm, Hà Nội', 150, 150, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Destination-proximate dropoff in Hanoi (city center)
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hanoi' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 4, 'Hanoi Old Quarter (City Center)', 'Phố Hàng Mã, Hoàn Kiếm, Hà Nội', 152, 152, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Ho Chi Minh City -> Da Nang
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Nang' LIMIT 1
)
-- Extra pickup near HCMC origin (office / district 1)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Ho Chi Minh City - District 1 Office', '273 Phạm Ngũ Lão, Phường Phạm Ngũ Lão, Quận 1, Thành phố Hồ Chí Minh', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Nang' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Ho Chi Minh City - Mien Dong Bus Station', '292 Đinh Bộ Lĩnh, Phường 26, Bình Thạnh, Thành phố Hồ Chí Minh', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Nang' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Nha Trang Bus Station', 'Bến xe Nha Trang, Đường Lê Lợi, Phường Lộc Thọ, Nha Trang, Khánh Hòa', 360, 360, TRUE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Nang' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 3, 'Da Nang Central Station', 'Ga Đà Nẵng, 791 Hải Phòng, Thanh Khê, Đà Nẵng', 480, 480, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Hanoi -> Ho Chi Minh City
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1
)
-- Extra pickup near Hanoi origin (city-center office)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Hanoi City Center Office', 'Số 5, Phố Tràng Tiền, Hoàn Kiếm, Hà Nội', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Hanoi Bus Terminal', 'Bến xe Mỹ Đình, Phạm Hùng, Nam Từ Liêm, Hà Nội', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Da Nang Central Station', 'Ga Đà Nẵng, 791 Hải Phòng, Thanh Khê, Đà Nẵng', 300, 300, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 3, 'Ho Chi Minh City - Mien Dong Bus Station', '292 Đinh Bộ Lĩnh, Phường 26, Bình Thạnh, Thành phố Hồ Chí Minh', 360, 360, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Destination-proximate dropoff in HCMC (district 1 office)
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Ho Chi Minh City' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 4, 'Ho Chi Minh City - District 1 Office', '273 Phạm Ngũ Lão, Phường Phạm Ngũ Lão, Quận 1, Thành phố Hồ Chí Minh', 380, 380, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;
