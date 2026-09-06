require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const VAT_RATE = 0.075;      // 7.5% VAT
const SERVICE_RATE = 0.05;   // 5% service charge
const SERVICE_BUFFER = 0;    // no buffer: the estimate is prep time only
// ---------- MENU ----------

app.get('/api/menu', async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, description, price, prep_minutes, category, allergens, image_url
     FROM menu_items
     WHERE is_available = true
     ORDER BY category, name`
  );
  res.json(result.rows);
});

// ---------- TABLES ----------

app.get('/api/tables', async (req, res) => {
  const result = await pool.query(
    `SELECT table_number, seats, label FROM restaurant_tables ORDER BY table_number`
  );
  res.json(result.rows);
});

// ---------- STAFF ----------

app.get('/api/staff', async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, role FROM staff WHERE is_active = true ORDER BY role, name`
  );
  res.json(result.rows);
});

// ---------- ORDERS ----------

app.post('/api/orders', async (req, res) => {
  const { table_number, items } = req.body;

  if (!table_number || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'A table number and at least one item are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ids = items.map(i => i.menu_item_id);
    const menu = await client.query(
      `SELECT id, price, prep_minutes, category FROM menu_items WHERE id = ANY($1)`,
      [ids]
    );

    let subtotal = 0;
    let kitchenMinutes = 0;
    let barMinutes = 0;

    for (const item of items) {
      const row = menu.rows.find(m => m.id === item.menu_item_id);
      if (!row) throw new Error('Unknown menu item: ' + item.menu_item_id);

      subtotal += Number(row.price) * item.quantity;
      const minutes = row.prep_minutes * item.quantity;

      // the kitchen and the bar work at the same time, so their times are
      // accumulated separately and the longer of the two governs the wait
      const fromBar = row.category === 'non-alcoholic' || row.category === 'alcoholic';
      if (fromBar) barMinutes += minutes;
      else kitchenMinutes += minutes;
    }

    const waitMinutes = Math.max(kitchenMinutes, barMinutes) + SERVICE_BUFFER;
    const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
    const service = Math.round(subtotal * SERVICE_RATE * 100) / 100;
    const total = subtotal + vat + service;

    const order = await client.query(
      `INSERT INTO orders (table_number, wait_minutes, subtotal, vat, service_charge, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [table_number, waitMinutes, subtotal, vat, service, total]
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
    `SELECT oi.quantity, oi.unit_price, m.name, m.category, m.allergens
     FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = $1`,
    [id]
  );

  const rating = await pool.query(`SELECT * FROM ratings WHERE order_id = $1`, [id]);
  const complaints = await pool.query(
    `SELECT * FROM complaints WHERE order_id = $1 ORDER BY created_at`, [id]
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

app.patch('/api/orders/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { waiter_id, chef_id, bartender_id, mark_served, takeaway } = req.body;

  const result = await pool.query(
    `UPDATE orders
     SET waiter_id    = COALESCE($1, waiter_id),
         chef_id      = COALESCE($2, chef_id),
         bartender_id = COALESCE($3, bartender_id),
         takeaway     = COALESCE($4, takeaway),
         status       = CASE WHEN $5 THEN 'served' ELSE 'assigned' END,
         served_at    = CASE WHEN $5 THEN NOW() ELSE served_at END
     WHERE id = $6
     RETURNING *`,
    [waiter_id || null, chef_id || null, bartender_id || null,
     takeaway === undefined ? null : takeaway, !!mark_served, id]
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

  const result = await pool.query(
    `INSERT INTO ratings (order_id, score, comment)
     VALUES ($1, $2, $3)
     ON CONFLICT (order_id) DO UPDATE SET score = $2, comment = $3, created_at = NOW()
     RETURNING *`,
    [id, score, comment || null]
  );
  res.status(201).json(result.rows[0]);
});

// ---------- PAYMENT (one per order, only once served) ----------
app.post('/api/orders/:id/payment', async (req, res) => {
  const { id } = req.params;
  const { method, takeaway } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await client.query(
      `SELECT total_amount, status FROM orders WHERE id = $1`, [id]
    );
    if (order.rowCount === 0) throw new Error('Order not found');

    const status = order.rows[0].status;
    if (status === 'paid') throw new Error('This order has already been paid');

    // a customer pays on the way out, so the food must have arrived first
    if (status !== 'served') {
      throw new Error('This order has not been served yet. Payment is taken once the food arrives.');
    }

    const payment = await client.query(
      `INSERT INTO payments (order_id, amount, method, is_simulated)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [id, order.rows[0].total_amount, method || 'card']
    );

    await client.query(
      `UPDATE orders SET status = 'paid', takeaway = $2 WHERE id = $1`,
      [id, !!takeaway]
    );
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
