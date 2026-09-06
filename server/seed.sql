-- Chowly: seed data
-- Tables, staff and menu, loaded ahead of the restaurant opening

TRUNCATE restaurant_tables RESTART IDENTITY CASCADE;

INSERT INTO restaurant_tables (table_number, seats, label) VALUES
  (1, 2,  'Table 1'),
  (2, 2,  'Table 2'),
  (3, 5,  'Table 3'),
  (4, 5,  'Table 4'),
  (5, 10, 'Table 5'),
  (6, 10, 'Table 6');

INSERT INTO staff (name, role)
SELECT * FROM (VALUES
  ('Konge',     'waiter'),
  ('Grace',     'waiter'),
  ('Tunde',     'waiter'),
  ('Gbrika',    'chef'),
  ('Olayimika', 'chef'),
  ('Ifeoma',    'chef'),
  ('Chioma',    'bartender'),
  ('Eze',       'bartender')
) AS s(name, role)
WHERE NOT EXISTS (SELECT 1 FROM staff);

INSERT INTO menu_items (name, description, price, prep_minutes, category, allergens) VALUES

-- ---------- STARTERS ----------
('Pepper Soup',         'Goat meat in a peppery broth with scent leaf',        9500,  8, 'starters', '{}'),
('Suya Skewers',        'Spiced beef skewers with onions and yaji',            8000,  6, 'starters', '{Peanuts}'),
('Chicken Wings',       'Grilled wings tossed in honey pepper glaze',          9000,  7, 'starters', '{}'),
('Puff Puff',           'Golden fried dough balls, six pieces',                4000,  5, 'starters', '{"Wheat / Gluten",Eggs}'),
('Spring Rolls',        'Vegetable rolls with sweet chilli dip',               5500,  5, 'starters', '{"Wheat / Gluten",Soy}'),
('Samosa',              'Minced beef parcels, four pieces',                    5500,  5, 'starters', '{"Wheat / Gluten"}'),
('Meat Pie',            'Shortcrust pastry with beef and potato',              4500,  4, 'starters', '{"Wheat / Gluten",Eggs,"Milk / Dairy"}'),
('Sausage Rolls',       'Flaky pastry with seasoned sausage, three pieces',    4500,  4, 'starters', '{"Wheat / Gluten",Eggs,"Milk / Dairy"}'),
('Asun',                'Smoked goat meat tossed in peppers',                 11000,  7, 'starters', '{}'),
('Peppered Snail',      'Sautéed snail in pepper sauce',                      13500,  9, 'starters', '{Shellfish}'),

-- ---------- NIGERIAN MAINS ----------
('Jollof Rice & Chicken',   'Smoky party jollof with grilled chicken',        17000,  8, 'nigerian', '{}'),
('Fried Rice & Turkey',     'Vegetable fried rice with grilled turkey',       18000,  8, 'nigerian', '{Soy,Eggs}'),
('Ofada Rice & Ayamase',    'Local rice with green pepper sauce and beef',    19000, 10, 'nigerian', '{}'),
('Egusi & Pounded Yam',     'Melon seed stew with assorted meat',             19500,  9, 'nigerian', '{"Egusi (Melon Seed)",Crab}'),
('Efo Riro & Semo',         'Spinach stew with assorted meat and semolina',   17500,  9, 'nigerian', '{Crab}'),
('Okra Soup & Amala',       'Okra with goat meat, stockfish and amala',       17500,  9, 'nigerian', '{Fish,Crab}'),
('Afang Soup & Eba',        'Afang leaves with periwinkle and beef',          18500, 10, 'nigerian', '{Shellfish,Crab}'),
('Banga Soup & Starch',     'Palm fruit soup with catfish',                   19500, 10, 'nigerian', '{Fish}'),
('Grilled Tilapia',         'Whole tilapia with pepper sauce and boiled yam', 24000, 11, 'nigerian', '{Fish}'),
('Nkwobi',                  'Cow foot in spicy palm oil sauce',               14500,  8, 'nigerian', '{}'),

-- ---------- INTERNATIONAL ----------
('Adana Kebab',             'Minced lamb skewer with sumac onions and lavash', 22000, 10, 'international', '{"Wheat / Gluten"}'),
('Chicken Shawarma Bowl',   'Spiced chicken with pickles, rice and garlic sauce', 19000,  8, 'international', '{"Milk / Dairy","Wheat / Gluten",Sesame}'),
('Turkish Pasta',           'Pasta in tomato butter with garlic yoghurt',     17500,  9, 'international', '{"Milk / Dairy","Wheat / Gluten",Eggs}'),
('Chicken Chickpea Curry',  'Gently spiced curry with rice and naan',         20000, 11, 'international', '{"Milk / Dairy","Wheat / Gluten"}'),
('Lamb Burger',             'Lamb patty with tzatziki and skin-on fries',     21000,  9, 'international', '{"Wheat / Gluten",Eggs,Sesame,"Milk / Dairy"}'),
('Shredded Chicken Nachos', 'Corn chips with chicken, cheese and guacamole',  16000,  7, 'international', '{"Milk / Dairy"}'),
('Salmon Coconut Soup',     'Salmon in coconut broth with crusty bread',      26000, 10, 'international', '{Fish,"Wheat / Gluten"}'),
('Beef Stir-Fry & Noodles', 'Wok-fried beef and vegetables over egg noodles', 18500,  8, 'international', '{Soy,"Wheat / Gluten",Eggs,Sesame}'),
('Margherita Pizza',        'Tomato, mozzarella and basil, twelve inch',      16500, 10, 'international', '{"Wheat / Gluten","Milk / Dairy"}'),
('Fish & Chips',            'Battered cod with chips and tartare',            19500,  9, 'international', '{Fish,"Wheat / Gluten",Eggs}'),

-- ---------- SIDES ----------
('Fried Plantain',      'Sweet ripe plantain, lightly fried',                  3500,  4, 'sides', '{}'),
('Jollof Rice',         'A side portion of party jollof',                      6000,  5, 'sides', '{}'),
('Skin-On Fries',       'Chunky fries with sea salt',                          4500,  5, 'sides', '{}'),
('Coleslaw',            'Crisp cabbage and carrot in creamy dressing',         3000,  2, 'sides', '{Eggs,"Milk / Dairy"}'),
('Moi Moi',             'Steamed bean pudding with egg',                       4000,  6, 'sides', '{Eggs}'),
('Shepherd Salad',      'Tomato, cucumber and onion with sumac',               5000,  3, 'sides', '{}'),
('Garlic Bread',        'Toasted baguette with garlic butter',                 4000,  4, 'sides', '{"Wheat / Gluten","Milk / Dairy"}'),

-- ---------- DESSERTS ----------
('Chocolate Fondant',   'Warm chocolate cake with a molten centre',            8500,  9, 'desserts', '{"Wheat / Gluten",Eggs,"Milk / Dairy"}'),
('Puff Puff & Ice Cream','Golden puff puff with vanilla ice cream',            6500,  5, 'desserts', '{"Wheat / Gluten",Eggs,"Milk / Dairy"}'),
('Chin Chin Sundae',    'Vanilla ice cream with crunchy chin chin',            6000,  4, 'desserts', '{"Wheat / Gluten",Eggs,"Milk / Dairy"}'),
('Coconut Candy',       'Chewy toasted coconut bites',                         3500,  2, 'desserts', '{}'),
('Cheesecake',          'Baked vanilla cheesecake with berry coulis',          9000,  4, 'desserts', '{"Milk / Dairy",Eggs,"Wheat / Gluten"}'),

-- ---------- NON-ALCOHOLIC ----------
('Still Water',         'Chilled bottled water, 75cl',                         2500,  2, 'non-alcoholic', '{}'),
('Sparkling Water',     'Chilled sparkling water, 75cl',                       3500,  2, 'non-alcoholic', '{}'),
('Soft Drink',          'Coke, Fanta or Sprite, chilled',                      2500,  2, 'non-alcoholic', '{}'),
('Fresh Orange Juice',  'Hand-pressed oranges, no sugar added',                5000,  3, 'non-alcoholic', '{}'),
('Zobo',                'Hibiscus infusion with ginger and pineapple',         4500,  3, 'non-alcoholic', '{}'),
('Mango Smoothie',      'Blended mango with yoghurt and honey',                6500,  4, 'non-alcoholic', '{"Milk / Dairy"}'),
('Chocolate Milkshake', 'Thick chocolate shake with whipped cream',            7000,  4, 'non-alcoholic', '{"Milk / Dairy"}'),
('Chapman',             'Chilled Nigerian punch with cucumber and bitters',    7000,  4, 'non-alcoholic', '{}'),
('Virgin Mojito',       'Lime, mint and soda over crushed ice',                6500,  4, 'non-alcoholic', '{}'),
('Virgin Piña Colada',  'Pineapple and coconut cream, blended',                7500,  5, 'non-alcoholic', '{"Milk / Dairy"}'),
('Fruit Punch',         'Mixed tropical fruit with a citrus finish',           6500,  4, 'non-alcoholic', '{}'),
('Berry Fizz',          'Mixed berries topped with soda',                      6500,  4, 'non-alcoholic', '{}'),

-- ---------- ALCOHOLIC ----------
('Strawberry Daiquiri', 'Blended strawberry with rum and lime',                9000,  5, 'alcoholic', '{}'),
('Pornstar Martini',    'Passionfruit martini with a vanilla finish',         10500,  6, 'alcoholic', '{}'),
('Mojito',              'White rum, lime, mint and soda',                      9000,  5, 'alcoholic', '{}'),
('Margarita',           'Tequila, triple sec and lime with a salt rim',        9500,  5, 'alcoholic', '{}'),
('Piña Colada',         'Rum, pineapple and coconut cream',                    9500,  6, 'alcoholic', '{"Milk / Dairy"}'),
('Cosmopolitan',        'Vodka, cranberry, triple sec and lime',               9500,  5, 'alcoholic', '{}'),
('Long Island Iced Tea','Five spirits with cola and lemon',                   11000,  6, 'alcoholic', '{}'),
('Espresso Martini',    'Vodka, coffee liqueur and fresh espresso',           11000,  6, 'alcoholic', '{}'),
('Tequila Sunrise',     'Tequila with orange and grenadine',                   9000,  5, 'alcoholic', '{}'),
('Star Lager',          'Chilled Nigerian lager, 60cl',                        4000,  2, 'alcoholic', '{"Wheat / Gluten"}'),
('Gulder',              'Chilled Nigerian lager, 60cl',                        4000,  2, 'alcoholic', '{"Wheat / Gluten"}'),
('Guinness Stout',      'Chilled extra stout, 60cl',                           4500,  2, 'alcoholic', '{"Wheat / Gluten"}'),
('Heineken',            'Chilled imported lager, 33cl',                        5000,  2, 'alcoholic', '{"Wheat / Gluten"}'),
('Red Wine',            'House Cabernet Sauvignon, by the glass',              8500,  3, 'alcoholic', '{}'),
('White Wine',          'House Chardonnay, by the glass',                      8500,  3, 'alcoholic', '{}'),
('Prosecco',            'Chilled sparkling, by the glass',                     9500,  3, 'alcoholic', '{}'),
('Jameson',             'Irish whiskey, single shot',                          7000,  2, 'alcoholic', '{}'),
('Jack Daniel''s',      'Tennessee whiskey, single shot',                      8000,  2, 'alcoholic', '{}'),
('Grey Goose',          'French vodka, single shot',                           9000,  2, 'alcoholic', '{}'),
('Jose Cuervo',         'Silver tequila, single shot',                         7500,  2, 'alcoholic', '{}'),
('Bombay Sapphire',     'London dry gin, single shot',                         7500,  2, 'alcoholic', '{}');
