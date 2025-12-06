INSERT INTO seat_layouts (bus_model_id, layout_json) VALUES
('142112ea-5f96-4689-bee4-b73430cbc190',
'{
  "type": "seated",
  "floors": 1,
  "rows": [
    {"row": 1, "seats": ["A1", "A2", null, "B1", "B2"]},
    {"row": 2, "seats": ["A3", "A4", null, "B3", "B4"]},
    {"row": 3, "seats": ["A5", "A6", null, "B5", "B6"]},
    {"row": 4, "seats": ["A7", "A8", null, "B7", "B8"]},
    {"row": 5, "seats": ["A9", "A10", null, "B9", "B10"]},
    {"row": 6, "seats": ["A11", "A12", null, "B11", "B12"]},
    {"row": 7, "seats": ["A13", "A14", null, "B13", "B14"]},
    {"row": 8, "seats": ["A15", "A16", null, "B15", "B16"]},
    {"row": 9, "seats": ["A17", "A18", null, "B17", "B18"]},
    {"row": 10, "seats": ["A19", "A20", "A21", "A22", "A23"]}
  ]
}');

INSERT INTO seat_layouts (bus_model_id, layout_json) VALUES
((SELECT bus_model_id FROM bus_models WHERE name = 'Tracomeco Highlander 38 sleepers'),
'{
  "type": "sleeper",
  "floors": 1,
  "rows": [
    {"row": 1, "seats": ["H1A", "H1B"]},
    {"row": 2, "seats": ["H2A", "H2B"]},
    {"row": 3, "seats": ["H3A", "H3B"]},
    {"row": 4, "seats": ["H4A", "H4B"]},
    {"row": 5, "seats": ["H5A", "H5B"]},
    {"row": 6, "seats": ["H6A", "H6B"]},
    {"row": 7, "seats": ["H7A", "H7B"]},
    {"row": 8, "seats": ["H8A", "H8B"]},
    {"row": 9, "seats": ["H9A", "H9B"]},
    {"row": 10, "seats": ["H10A", "H10B"]},
    {"row": 11, "seats": ["H11A", "H11B"]},
    {"row": 12, "seats": ["H12A", "H12B"]},
    {"row": 13, "seats": ["H13A", "H13B"]},
    {"row": 14, "seats": ["H14A", "H14B"]},
    {"row": 15, "seats": ["H15A", "H15B"]},
    {"row": 16, "seats": ["H16A", "H16B"]},
    {"row": 17, "seats": ["H17A", "H17B"]},
    {"row": 18, "seats": ["H18A", "H18B"]},
    {"row": 19, "seats": ["H19A", "H19B"]}
  ]
}');

INSERT INTO seat_layouts (bus_model_id, layout_json) VALUES
((SELECT bus_model_id FROM bus_models WHERE name = 'Fuso Rosa 22 seated'),
'{
  "type": "seated",
  "floors": 1,
  "rows": [
    {"row": 1, "seats": ["A1", "A2", null, "B1", "B2"]},
    {"row": 2, "seats": ["A3", "A4", null, "B3", "B4"]},
    {"row": 3, "seats": ["A5", "A6", null, "B5", "B6"]},
    {"row": 4, "seats": ["A7", "A8", null, "B7", "B8"]},
    {"row": 5, "seats": ["A9", "A10", null, "B9", "B10"]},
    {"row": 6, "seats": ["A11", "A12", "A13", "A14", "A15"]}
  ]
}');

INSERT INTO seat_layouts (bus_model_id, layout_json) VALUES
((SELECT bus_model_id FROM bus_models WHERE name = 'Mercedes Sprinter 16 seats'),
'{
  "type": "seated",
  "floors": 1,
  "rows": [
    {"row": 1, "seats": ["A1", "A2", null, "B1", "B2"]},
    {"row": 2, "seats": ["A3", "A4", null, "B3", "B4"]},
    {"row": 3, "seats": ["A5", "A6", null, "B5", "B6"]},
    {"row": 4, "seats": ["A7", "A8", "A9", "A10", "A11"]}
  ]
}');