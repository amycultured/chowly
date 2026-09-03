require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- MENU ----------

// list every available item, food first
app.get('/api/menu', async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, description, price, prep_minutes, category
     FROM menu_items
     WHERE is_available = true
     ORDER BY category, name`
  );
  res.json(result.rows);
});

// ---------- STAFF ----------

// list active staff, used by the waiter's dropdowns
app.get('/api/staff', async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, role FROM staff WHERE is_active = true ORDER BY role, name`
  );
  res.json(result.rows);
});

// ---------- ORDERS ----------

// place an order
app.post('/api/orders', async (req, res) => {
  const { table_number, items } = req.body;

  if (!table_number || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'A table number and at least one item are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // read prices and prep times from the database, never from the browser
    const ids = items.map(i => i.menu_item_id);
    const menu = await client.query(
      `SELECT id, price, prep_minutes, category FROM menu_items WHERE id = ANY($1)`,
      [ids]
    );

    let total = 0;
    let foodMinutes = 0;
    let drinkMinutes = 0;

    for (const item of items) {
      const row = menu.rows.find(m => m.id === item.menu_item_id);
      if (!row) throw new Error('Unknown menu item: ' + item.menu_item_id);

      total += Number(row.price) * item.quantity;
      const minutes = row.prep_minutes * item.quantity;

      // the kitchen and the bar work at the same time, so their
      // times are accumulated separately rather than added together
      if (row.category === 'drink') drinkMinutes += minutes;
      else foodMinutes += minutes;
    }

    const waitMinutes = Math.max(foodMinutes, drinkMinutes) + 5; // 5 minutes for service

    const order = await client.query(
      `INSERT INTO orders (table_number, wait_minutes, total_amount)
       VALUES ($1, $2, $3) RETURNING *`,
      [table_number, waitMinutes, total]
    );
    const orderId = order.rows[0].id;

    for (const item of items) {
      const row = menu.rows.find(m => m.id === item.menu_item_id);
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.menu_item_id, item.quantity, row.price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(order.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// every order, for the waiter's list
app.get('/api/orders', async (req, res) => {
  const result = await pool.query(
    `SELECT o.*, w.name AS waiter_name,
            (SELECT COUNT(*) FROM complaints c WHERE c.order_id = o.id) AS complaint_count,
            (SELECT score FROM ratings r WHERE r.order_id = o.id) AS rating_score
     FROM orders o
     LEFT JOIN staff w ON w.id = o.waiter_id
     ORDER BY o.placed_at DESC`
  );
  res.json(result.rows);
});

// one order, with its items and everything attached to it
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;

  const order = await pool.query(
    `SELECT o.*,
            w.name AS waiter_name,
            c.name AS chef_name,
            b.name AS bartender_name
     FROM orders o
     LEFT JOIN staff w ON w.id = o.waiter_id
     LEFT JOIN staff c ON c.id = o.chef_id
     LEFT JOIN staff b ON b.id = o.bartender_id
     WHERE o.id = $1`,
    [id]
  );
  if (order.rowCount === 0) return res.status(404).json({ error: 'Order not found' });

  const items = await pool.query(
    `SELECT oi.quantity, oi.unit_price, m.name, m.category
     FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = $1`,
    [id]
  );

  const rating = await pool.query(`SELECT * FROM ratings WHERE order_id = $1`, [id]);
  const complaints = await pool.query(
    `SELECT * FROM complaints WHERE order_id = $1 ORDER BY created_at`,
    [id]
  );
  const payment = await pool.query(`SELECT * FROM payments WHERE order_id = $1`, [id]);

  res.json({
    ...order.rows[0],
    items: items.rows,
    rating: rating.rows[0] || null,
    complaints: complaints.rows,
    payment: payment.rows[0] || null,
  });
});

// ---------- WAITER ACTIONS ----------

// the waiter records who prepared the order and marks it served
app.patch('/api/orders/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { waiter_id, chef_id, bartender_id, mark_served } = req.body;

  const result = await pool.query(
    `UPDATE orders
     SET waiter_id    = COALESCE($1, waiter_id),
         chef_id      = COALESCE($2, chef_id),
         bartender_id = COALESCE($3, bartender_id),
         status       = CASE WHEN $4 THEN 'served' ELSE 'assigned' END,
         served_at    = CASE WHEN $4 THEN NOW() ELSE served_at END
     WHERE id = $5
     RETURNING *`,
    [waiter_id || null, chef_id || null, bartender_id || null, !!mark_served, id]
  );

  if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
  res.json(result.rows[0]);
});

// ---------- COMPLAINTS (many per order) ----------

app.post('/api/orders/:id/complaints', async (req, res) => {
  const { id } = req.params;
  const reason = (req.body.reason || '').trim();
  if (!reason) return res.status(400).json({ error: 'A reason is required' });

  const result = await pool.query(
    `INSERT INTO complaints (order_id, reason) VALUES ($1, $2) RETURNING *`,
    [id, reason]
  );
  res.status(201).json(result.rows[0]);
});

// ---------- RATING (one per order) ----------

app.post('/api/orders/:id/rating', async (req, res) => {
  const { id } = req.params;
  const { score, comment } = req.body;

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return res.status(400).json({ error: 'Score must be a whole number from 1 to 5' });
  }

  // one rating per order: a second submission updates the first
  const result = await pool.query(
    `INSERT INTO ratings (order_id, score, comment)
     VALUES ($1, $2, $3)
     ON CONFLICT (order_id) DO UPDATE SET score = $2, comment = $3, created_at = NOW()
     RETURNING *`,
    [id, score, comment || null]
  );
  res.status(201).json(result.rows[0]);
});

// ---------- PAYMENT (one per order) ----------

app.post('/api/orders/:id/payment', async (req, res) => {
  const { id } = req.params;
  const { method } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await client.query(
      `SELECT total_amount, status FROM orders WHERE id = $1`,
      [id]
    );
    if (order.rowCount === 0) throw new Error('Order not found');
    if (order.rows[0].status === 'paid') throw new Error('This order has already been paid');

    const payment = await client.query(
      `INSERT INTO payments (order_id, amount, method, is_simulated)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [id, order.rows[0].total_amount, method || 'card']
    );

    await client.query(`UPDATE orders SET status = 'paid' WHERE id = $1`, [id]);
    await client.query('COMMIT');

    res.status(201).json(payment.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ---------- SERVE THE REACT APP ----------

const clientDir = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDir));
app.use((req, res) => res.sendFile(path.join(clientDir, 'index.html')));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Chowly API listening on port ' + port));
