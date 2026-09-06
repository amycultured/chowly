-- Chowly: migration 1
-- Adds allergens and images to the menu, a table list, and bill breakdown

-- menu items gain allergens and a picture
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- the restaurant's physical tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id           SERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL UNIQUE,
  seats        INTEGER NOT NULL CHECK (seats > 0),
  label        TEXT NOT NULL
);

-- orders gain the bill breakdown and a takeaway flag
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal       NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vat            NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_charge NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS takeaway       BOOLEAN NOT NULL DEFAULT false;

-- the category check has to allow the new categories
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_category_check;
ALTER TABLE menu_items ADD CONSTRAINT menu_items_category_check
  CHECK (category IN ('starters','nigerian','international','sides',
                      'desserts','non-alcoholic','alcoholic'));