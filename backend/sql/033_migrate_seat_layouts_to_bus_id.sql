-- Migration: Change seat_layouts to use bus_id instead of bus_model_id
-- This allows each bus to have its own seat layout instead of sharing by model

-- Step 1: Add new bus_id column
ALTER TABLE seat_layouts ADD COLUMN bus_id UUID REFERENCES buses(bus_id) ON DELETE CASCADE;

-- Step 2: Migrate existing data - for each bus that doesn't have a layout, create one from its model
INSERT INTO seat_layouts (bus_id, layout_json)
SELECT b.bus_id, sl.layout_json
FROM buses b
JOIN seat_layouts sl ON b.bus_model_id = sl.bus_model_id
WHERE NOT EXISTS (SELECT 1 FROM seat_layouts sl2 WHERE sl2.bus_id = b.bus_id);

-- Step 3: Drop the old bus_model_id column and its constraints
ALTER TABLE seat_layouts DROP CONSTRAINT seat_layouts_bus_model_id_fkey;
ALTER TABLE seat_layouts DROP COLUMN bus_model_id;

-- Step 4: Update indexes
DROP INDEX IF EXISTS idx_seat_layouts_bus_model_id;
CREATE INDEX IF NOT EXISTS idx_seat_layouts_bus_id ON seat_layouts(bus_id);

-- Step 5: Add unique constraint to ensure one layout per bus
ALTER TABLE seat_layouts ADD CONSTRAINT seat_layouts_bus_id_unique UNIQUE (bus_id);