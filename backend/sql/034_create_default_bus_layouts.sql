-- Update existing seat layouts and create default for buses that don't have one
UPDATE seat_layouts SET layout_json = '{
  "type": "standard",
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
    {"row": 10, "seats": ["8A","8B",null,"8C","8D"]}
  ]
}'::jsonb;

INSERT INTO seat_layouts (bus_id, layout_json)
SELECT b.bus_id,
'{
  "type": "standard",
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
    {"row": 10, "seats": ["8A","8B",null,"8C","8D"]}
  ]
}'::jsonb
FROM buses b
WHERE NOT EXISTS (SELECT 1 FROM seat_layouts sl WHERE sl.bus_id = b.bus_id);