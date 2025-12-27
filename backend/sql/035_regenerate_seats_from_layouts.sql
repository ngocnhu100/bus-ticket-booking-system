-- Delete all existing seats first
DELETE FROM seats;

-- Generate seats based on layout_json from seat_layouts table
INSERT INTO seats (bus_id, seat_code, seat_type, position, price, row_num, col_num, is_active)
SELECT
  b.bus_id,
  seat_element.value #>> '{}' as seat_code,
  CASE
    WHEN seat_element.value #>> '{}' LIKE 'VIP%' THEN 'vip'
    WHEN seat_element.value #>> '{}' LIKE 'H%A' OR seat_element.value #>> '{}' LIKE 'H%B' THEN 'vip'  -- Premium seats mapped to vip type
    ELSE 'standard'
  END as seat_type,
  CASE
    WHEN seat_element.value #>> '{}' ~ 'A$' THEN 'window'  -- Ends with A = window
    ELSE 'aisle'  -- B,C,D,E = aisle
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
JOIN seat_layouts sl ON b.bus_id = sl.bus_id
CROSS JOIN LATERAL jsonb_array_elements(sl.layout_json->'rows') as row_data
CROSS JOIN LATERAL jsonb_array_elements(row_data->'seats') WITH ORDINALITY as seat_element(value, column_index)
WHERE seat_element.value IS NOT NULL
  AND seat_element.value #>> '{}' != 'null'
ON CONFLICT (bus_id, seat_code) DO NOTHING;