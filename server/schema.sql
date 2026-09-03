-- Chowly: database schema
-- Built from the Chowly software architecture data model

CREATE TABLE IF NOT EXISTS menu_items (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  prep_minutes  INTEGER NOT NULL CHECK (prep_minutes >= 0),
  category      TEXT NOT NULL CHECK (category IN ('food','drink','dessert')),
  is_available  BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS staff (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('waiter','chef','bartender')),
  is_active  BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  table_number  INTEGER NOT NULL CHECK (table_number > 0),
  status        TEXT NOT NULL DEFAULT 'placed'
                CHECK (status IN ('placed','assigned','served','paid')),
  wait_minutes  INTEGER NOT NULL,
  total_amount  NUMERIC(10,2) NOT NULL,
  waiter_id     INTEGER REFERENCES staff(id),
  chef_id       INTEGER REFERENCES staff(id),
  bartender_id  INTEGER REFERENCES staff(id),
  placed_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  served_at     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  INTEGER NOT NULL REFERENCES menu_items(id),
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS complaints (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','under review','resolved')),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  method        TEXT NOT NULL CHECK (method IN ('card','cash','transfer')),
  is_simulated  BOOLEAN NOT NULL DEFAULT true,
  paid_at       TIMESTAMP NOT NULL DEFAULT NOW()
);