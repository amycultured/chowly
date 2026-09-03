-- Chowly: seed data
-- Menu items and staff, loaded ahead of the restaurant opening

INSERT INTO staff (name, role) VALUES
  ('Konge',     'waiter'),
  ('Grace',     'waiter'),
  ('Tunde',     'waiter'),
  ('Gbrika',    'chef'),
  ('Olayimika', 'chef'),
  ('Ifeoma',    'chef'),
  ('Chioma',    'bartender'),
  ('Eze',       'bartender');

INSERT INTO menu_items (name, description, price, prep_minutes, category) VALUES
  ('Jollof Rice and Chicken', 'Smoky party jollof with grilled chicken and fried plantain', 17000, 25, 'food'),
  ('Pepper Soup',             'Goat meat in a peppery broth with scent leaf',              27000, 30, 'food'),
  ('Salmon Steak and Pasta',  'Pan-seared salmon over creamy tagliatelle',                 37900, 45, 'food'),
  ('Egusi and Pounded Yam',   'Melon seed stew with assorted meat and pounded yam',        19500, 35, 'food'),
  ('Suya Platter',            'Spiced beef skewers with onions and yaji',                  15000, 20, 'food'),
  ('Grilled Tilapia',         'Whole tilapia with pepper sauce and boiled yam',            24000, 40, 'food'),
  ('Asun',                    'Smoked goat meat tossed in peppers',                        16500, 25, 'food'),
  ('Fried Rice and Turkey',   'Vegetable fried rice with grilled turkey',                  18000, 25, 'food'),
  ('Efo Riro and Semo',       'Spinach stew with assorted meat and semolina',              17500, 30, 'food'),
  ('Chicken Shawarma',        'Grilled chicken wrap with garlic sauce',                     9500, 15, 'food'),
  ('Chapman',                 'Chilled Nigerian punch with cucumber and bitters',           7000,  8, 'drink'),
  ('Strawberry Daiquiri',     'Blended strawberry with rum and lime',                       9000, 10, 'drink'),
  ('Pornstar Martini',        'Passionfruit martini with a vanilla finish',                10500, 15, 'drink'),
  ('Zobo',                    'Hibiscus infusion with ginger and pineapple',                4500,  6, 'drink'),
  ('Palm Wine',               'Fresh tapped palm wine, served chilled',                     6000,  5, 'drink'),
  ('Fresh Orange Juice',      'Hand-pressed oranges, no sugar added',                       5000,  5, 'drink'),
  ('Chocolate Fondant',       'Warm chocolate cake with a molten centre',                   8500, 20, 'dessert'),
  ('Puff Puff and Ice Cream', 'Golden puff puff with vanilla ice cream',                    6500, 12, 'dessert');
  