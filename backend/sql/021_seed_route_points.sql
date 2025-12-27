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
SELECT r.route_id, 2, 'Nha Trang Bus Station', 'Bến xe Nha Trang, Đường Lê Lợi, Phường Lộc Thọ, Nha Trang, Khánh Hòa', 360, 360, TRUE, FALSE
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

-- Route: Hanoi -> Da Nang
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Da Nang' LIMIT 1
)
-- Extra pickup near Hanoi origin
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Hanoi City Center Office', 'Số 5, Phố Tràng Tiền, Hoàn Kiếm, Hà Nội', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Da Nang' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Hanoi Bus Terminal', 'Bến xe Mỹ Đình, Phạm Hùng, Nam Từ Liêm, Hà Nội', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Da Nang' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Da Nang Central Station', 'Ga Đà Nẵng, 791 Hải Phòng, Thanh Khê, Đà Nẵng', 360, 360, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Destination-proximate dropoff in Da Nang
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Da Nang' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 3, 'Da Nang City Center', 'Số 1, Đường Trần Phú, Hải Châu, Đà Nẵng', 380, 380, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Ho Chi Minh City -> Hue
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hue' LIMIT 1
)
-- Extra pickup near HCMC origin
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Ho Chi Minh City - District 1 Office', '273 Phạm Ngũ Lão, Phường Phạm Ngũ Lão, Quận 1, Thành phố Hồ Chí Minh', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hue' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Ho Chi Minh City - Mien Dong Bus Station', '292 Đinh Bộ Lĩnh, Phường 26, Bình Thạnh, Thành phố Hồ Chí Minh', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hue' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Da Nang Central Station', 'Ga Đà Nẵng, 791 Hải Phòng, Thanh Khê, Đà Nẵng', 300, 300, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Hue' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 3, 'Hue Imperial City', 'Bến xe Huế, 6 Bùi Thị Xuân, Phú Hội, Thành phố Huế, Thừa Thiên Huế', 600, 600, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Da Nang -> Ho Chi Minh City
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Ho Chi Minh City' LIMIT 1
)
-- Extra pickup near Da Nang origin
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Da Nang City Center', 'Số 1, Đường Trần Phú, Hải Châu, Đà Nẵng', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Ho Chi Minh City' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Da Nang Central Station', 'Ga Đà Nẵng, 791 Hải Phòng, Thanh Khê, Đà Nẵng', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Ho Chi Minh City' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Ho Chi Minh City - Mien Dong Bus Station', '292 Đinh Bộ Lĩnh, Phường 26, Bình Thạnh, Thành phố Hồ Chí Minh', 540, 540, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Destination-proximate dropoff in HCMC
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Ho Chi Minh City' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 3, 'Ho Chi Minh City - District 1 Office', '273 Phạm Ngũ Lão, Phường Phạm Ngũ Lão, Quận 1, Thành phố Hồ Chí Minh', 560, 560, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Hanoi -> Sapa
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Sapa' LIMIT 1
)
-- Extra pickup near Hanoi origin
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Hanoi City Center Office', 'Số 5, Phố Tràng Tiền, Hoàn Kiếm, Hà Nội', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Sapa' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Hanoi Bus Terminal', 'Bến xe Mỹ Đình, Phạm Hùng, Nam Từ Liêm, Hà Nội', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Sapa' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Sapa Town Center', 'Bến xe Sapa, 1 Cầu Mây, Sa Pa, Lào Cai', 288, 288, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Ho Chi Minh City -> Nha Trang
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Nha Trang' LIMIT 1
)
-- Extra pickup near HCMC origin
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Ho Chi Minh City - District 1 Office', '273 Phạm Ngũ Lão, Phường Phạm Ngũ Lão, Quận 1, Thành phố Hồ Chí Minh', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Nha Trang' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Ho Chi Minh City - Mien Dong Bus Station', '292 Đinh Bộ Lĩnh, Phường 26, Bình Thạnh, Thành phố Hồ Chí Minh', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Nha Trang' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Nha Trang Bus Station', 'Bến xe Nha Trang, 17 Thái Nguyên, Phước Tân, Thành phố Nha Trang, Khánh Hòa', 252, 252, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Da Nang -> Hanoi
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Hanoi' LIMIT 1
)
-- Extra pickup near Da Nang origin
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Da Nang City Center', 'Số 1, Đường Trần Phú, Hải Châu, Đà Nẵng', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Hanoi' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Da Nang Central Station', 'Ga Đà Nẵng, 791 Hải Phòng, Thanh Khê, Đà Nẵng', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Hanoi' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Hanoi Bus Terminal', 'Bến xe Mỹ Đình, Phạm Hùng, Nam Từ Liêm, Hà Nội', 432, 432, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Destination-proximate dropoff in Hanoi
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Hanoi' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 3, 'Hanoi Old Quarter', 'Phố Hàng Mã, Hoàn Kiếm, Hà Nội', 450, 450, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Hanoi -> Hai Phong
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Hai Phong' LIMIT 1
)
-- Extra pickup near Hanoi origin
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Hanoi City Center Office', 'Số 5, Phố Tràng Tiền, Hoàn Kiếm, Hà Nội', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Hai Phong' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Hanoi Bus Terminal', 'Bến xe Mỹ Đình, Phạm Hùng, Nam Từ Liêm, Hà Nội', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Hanoi' AND destination = 'Hai Phong' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Hai Phong Bus Station', 'Bến xe Hải Phòng, Đường 5, Vĩnh Niệm, Lê Chân, Hải Phòng', 54, 54, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Ho Chi Minh City -> Can Tho
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Can Tho' LIMIT 1
)
-- Extra pickup near HCMC origin
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Ho Chi Minh City - District 1 Office', '273 Phạm Ngũ Lão, Phường Phạm Ngũ Lão, Quận 1, Thành phố Hồ Chí Minh', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Can Tho' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Ho Chi Minh City - Mien Dong Bus Station', '292 Đinh Bộ Lĩnh, Phường 26, Bình Thạnh, Thành phố Hồ Chí Minh', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Can Tho' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Can Tho Bus Station', 'Bến xe Cần Thơ, 123 Đường 30/4, Xuân Khánh, Ninh Kiều, Cần Thơ', 90, 90, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Da Nang -> Quang Ngai
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Quang Ngai' LIMIT 1
)
-- Extra pickup near Da Nang origin
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Da Nang City Center', 'Số 1, Đường Trần Phú, Hải Châu, Đà Nẵng', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Quang Ngai' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Da Nang Central Station', 'Ga Đà Nẵng, 791 Hải Phòng, Thanh Khê, Đà Nẵng', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Da Nang' AND destination = 'Quang Ngai' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Quang Ngai Bus Station', 'Bến xe Quảng Ngãi, 1 Đường 24/3, Nghĩa Chánh, Quảng Ngãi', 72, 72, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Route: Ho Chi Minh City -> Da Lat
WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Lat' LIMIT 1
)
-- Extra pickup near HCMC origin
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 0, 'Ho Chi Minh City - District 1 Office', '273 Phạm Ngũ Lão, Phường Phạm Ngũ Lão, Quận 1, Thành phố Hồ Chí Minh', -20, -20, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Lat' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 1, 'Ho Chi Minh City - Mien Dong Bus Station', '292 Đinh Bộ Lĩnh, Phường 26, Bình Thạnh, Thành phố Hồ Chí Minh', 0, 0, TRUE, FALSE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH r AS (
  SELECT route_id FROM routes WHERE origin = 'Ho Chi Minh City' AND destination = 'Da Lat' LIMIT 1
)
INSERT INTO route_points (route_id, sequence, name, address, departure_offset_minutes, arrival_offset_minutes, is_pickup, is_dropoff)
SELECT r.route_id, 2, 'Da Lat Central Station', 'Bến xe Đà Lạt, 1 Đường 3/2, Phường 1, Thành phố Đà Lạt, Lâm Đồng', 360, 360, FALSE, TRUE
FROM r
WHERE r.route_id IS NOT NULL
ON CONFLICT DO NOTHING;
