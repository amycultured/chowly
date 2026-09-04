import { useState, useEffect } from 'react'

const naira = n => '₦' + Number(n).toLocaleString('en-NG')

export default function App() {
  const [role, setRole] = useState(null)
  const [orderId, setOrderId] = useState(null)

  if (!role) return <Landing onPick={setRole} />

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand" onClick={() => { setRole(null); setOrderId(null) }}
               style={{ cursor: 'pointer' }}>
            <Logo />
          </div>
          <button className="btn ghost" style={{ padding: '7px 14px', fontSize: '.85rem' }}
                  onClick={() => { setRole(null); setOrderId(null) }}>
            {role === 'customer' ? 'Dining' : 'Staff'} · switch
          </button>
        </div>
      </header>

      <main className="page">
        {role === 'customer'
          ? (orderId
              ? <OrderStatus id={orderId} onNew={() => setOrderId(null)} />
              : <Menu onPlaced={setOrderId} />)
          : <WaiterView />}
      </main>
    </>
  )
}

/* ---------------- LOGO ---------------- */

function Logo({ height = 34 }) {
  return <img src="/chowly-logo.png" alt="Chowly" className="logo-img" style={{ height }} />
}

/* ---------------- LANDING ---------------- */

function Landing({ onPick }) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="landing-brand"><Logo height={72} /></div>
        <p className="landing-tag">Order from your table. Pay when you're done.</p>

        <div className="doors">
          <button className="door dine" onClick={() => onPick('customer')}>
            <span className="door-icon" aria-hidden="true">🍽️</span>
            <span className="door-title">I'm dining</span>
            <span className="door-sub">Browse the menu and place an order</span>
          </button>

          <button className="door staff" onClick={() => onPick('waiter')}>
            <span className="door-icon" aria-hidden="true">🧾</span>
            <span className="door-title">Staff</span>
            <span className="door-sub">Assign orders and mark them served</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- CUSTOMER: MENU + CART ---------------- */

function Menu({ onPlaced }) {
  const [items, setItems] = useState([])
  const [cart, setCart] = useState({})
  const [table, setTable] = useState('')
  const [checkout, setCheckout] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then(setItems).catch(() => setError('Could not load the menu'))
  }, [])

  const add = id => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const sub = id => setCart(c => {
    const n = (c[id] || 0) - 1
    const next = { ...c }
    if (n <= 0) delete next[id]; else next[id] = n
    return next
  })

  const lines = Object.entries(cart).map(([id, qty]) => ({
    ...items.find(i => i.id === Number(id)), quantity: qty
  })).filter(l => l.id)

  const total = lines.reduce((s, l) => s + Number(l.price) * l.quantity, 0)
  const count = lines.reduce((s, l) => s + l.quantity, 0)

  async function submit() {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: Number(table),
          items: lines.map(l => ({ menu_item_id: l.id, quantity: l.quantity }))
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not place the order')
      onPlaced(data.id)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  if (checkout) {
    return (
      <>
        <h1>Your order</h1>
        <p className="muted">Check everything over before you send it to the kitchen.</p>
        <div className="card">
          {lines.map(l => (
            <div className="row" key={l.id}>
              <span>{l.quantity} × {l.name}</span>
              <span className="price">{naira(Number(l.price) * l.quantity)}</span>
            </div>
          ))}
          <div className="row"><strong>Total</strong><strong className="price">{naira(total)}</strong></div>
        </div>

        <div className="card">
          <div className="field">
            <label htmlFor="table">Which table are you at?</label>
            <input id="table" type="number" min="1" value={table}
              onChange={e => setTable(e.target.value)} placeholder="e.g. 5" />
          </div>
          {error && <div className="banner pretend">{error}</div>}
          <button className="btn primary full" disabled={!table || busy} onClick={submit}>
            {busy ? 'Sending to the kitchen…' : 'Place order'}
          </button>
          <button className="btn ghost full" style={{ marginTop: 8 }} onClick={() => setCheckout(false)}>
            Back to menu
          </button>
        </div>
      </>
    )
  }

  const groups = [['food', 'Food'], ['drink', 'Drinks'], ['dessert', 'Dessert']]

  return (
    <>
      <h1>What are you having?</h1>
      <p className="muted">Everything is prepared to order. Times are a guide.</p>
      {error && <div className="banner pretend">{error}</div>}

      {groups.map(([key, label]) => {
        const group = items.filter(i => i.category === key)
        if (!group.length) return null
        return (
          <section key={key}>
            <div className="section-head">
              <h2>{label}</h2><span className="count">{group.length} items</span>
            </div>
            {group.map(item => (
              <div className="card item" key={item.id}>
                <div className="item-body">
                  <div className="item-name">{item.name}</div>
                  <div className="item-desc">{item.description}</div>
                  <div className="item-meta">
                    <span className="price">{naira(item.price)}</span>
                    <span className="pill time">{item.prep_minutes} min</span>
                  </div>
                </div>
                {cart[item.id]
                  ? <div className="qty">
                      <button onClick={() => sub(item.id)}>−</button>
                      <span>{cart[item.id]}</span>
                      <button onClick={() => add(item.id)}>+</button>
                    </div>
                  : <button className="btn ghost" onClick={() => add(item.id)}>Add</button>}
              </div>
            ))}
          </section>
        )
      })}

      {count > 0 && (
        <div className="cartbar">
          <div className="cartbar-inner">
            <div>
              <div style={{ fontWeight: 600 }}>{count} item{count > 1 ? 's' : ''}</div>
              <div className="price">{naira(total)}</div>
            </div>
            <button className="btn primary" onClick={() => setCheckout(true)}>Review order</button>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------------- CUSTOMER: ORDER STATUS ---------------- */

function OrderStatus({ id, onNew }) {
  const [order, setOrder] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/orders/' + id).then(r => r.json()).then(setOrder)
  useEffect(() => { load() }, [id])
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    const p = setInterval(load, 10000)
    return () => { clearInterval(t); clearInterval(p) }
  }, [id])

  if (!order) return <div className="empty">Loading your order…</div>

  const ready = new Date(order.placed_at).getTime() + order.wait_minutes * 60000
  const left = Math.round((ready - now) / 1000)
  const over = left < 0
  const mm = Math.floor(Math.abs(left) / 60)
  const ss = String(Math.abs(left) % 60).padStart(2, '0')

  async function post(path, body, done) {
    const res = await fetch(`/api/orders/${id}/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    const data = await res.json()
    setMsg(res.ok ? done : (data.error || 'Something went wrong'))
    load()
  }

  return (
    <>
      <h1>Order #{order.id}</h1>
      <p className="muted">
        Table {order.table_number} · <span className={'status ' + order.status}>{order.status}</span>
      </p>

      {order.status !== 'paid' && (
        <div className={'timer' + (over ? ' over' : '')}>
          <div className="value">{mm}:{ss}</div>
          <div className="label">{over ? 'over the estimate' : 'estimated wait remaining'}</div>
        </div>
      )}

      <div className="card">
        {order.items.map((it, n) => (
          <div className="row" key={n}>
            <span>{it.quantity} × {it.name}</span>
            <span className="price">{naira(Number(it.unit_price) * it.quantity)}</span>
          </div>
        ))}
        <div className="row"><strong>Total</strong><strong className="price">{naira(order.total_amount)}</strong></div>
      </div>

      {(order.chef_name || order.bartender_name || order.waiter_name) && (
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Who looked after you</h3>
          {order.waiter_name && <div className="row"><span className="muted">Waiter</span><span>{order.waiter_name}</span></div>}
          {order.chef_name && <div className="row"><span className="muted">Chef</span><span>{order.chef_name}</span></div>}
          {order.bartender_name && <div className="row"><span className="muted">Bartender</span><span>{order.bartender_name}</span></div>}
        </div>
      )}

      {msg && <div className="banner pretend">{msg}</div>}

      {order.status !== 'paid' && (
        <>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>How was it?</h3>
            <div className="stars">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} className={n <= score ? 'on' : ''} onClick={() => setScore(n)}>★</button>
              ))}
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <textarea rows="2" value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Anything you'd like to add" />
            </div>
            <button className="btn ghost full" disabled={!score}
              onClick={() => post('rating', { score, comment }, 'Thank you, your rating has been saved.')}>
              Submit rating
            </button>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Something wrong?</h3>
            <div className="field">
              <textarea rows="2" value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Tell us what happened" />
            </div>
            <button className="btn ghost full" disabled={!reason.trim()}
              onClick={() => { post('complaints', { reason }, 'Your complaint has been logged.'); setReason('') }}>
              Submit complaint
            </button>
            {order.complaints.length > 0 && (
              <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
                {order.complaints.length} complaint{order.complaints.length > 1 ? 's' : ''} logged against this order.
              </p>
            )}
          </div>

          <div className="card">
            <div className="banner pretend">Payment is simulated. No money changes hands.</div>
            <button className="btn primary full"
              onClick={() => post('payment', { method: 'card' }, 'Paid. Thank you.')}>
              Pay {naira(order.total_amount)}
            </button>
          </div>
        </>
      )}

      {order.status === 'paid' && (
        <div className="card">
          <h3>Receipt</h3>
          <p className="muted" style={{ marginTop: 4 }}>
            Paid by {order.payment?.method} · simulated payment
          </p>
          <div className="row"><span>Order #{order.id}, table {order.table_number}</span>
            <strong className="price">{naira(order.total_amount)}</strong></div>
          <button className="btn ghost full" style={{ marginTop: 12 }} onClick={onNew}>
            Start a new order
          </button>
        </div>
      )}
    </>
  )
}

/* ---------------- WAITER ---------------- */

function WaiterView() {
  const [orders, setOrders] = useState([])
  const [open, setOpen] = useState(null)

  const load = () => fetch('/api/orders').then(r => r.json()).then(setOrders)
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [])

  if (open) return <WaiterOrder id={open} onBack={() => { setOpen(null); load() }} />

  const counts = orders.reduce((a, o) => ({ ...a, [o.status]: (a[o.status] || 0) + 1 }), {})

  return (
    <>
      <h1>Orders</h1>
      <p className="muted">
        {orders.length} today · {counts.placed || 0} waiting · {counts.served || 0} served · {counts.paid || 0} paid
      </p>

      {orders.length === 0 && <div className="empty">No orders yet. They'll appear here as they come in.</div>}

      {orders.map(o => {
        const late = new Date(o.placed_at).getTime() + o.wait_minutes * 60000 < Date.now()
                     && o.status !== 'served' && o.status !== 'paid'
        return (
          <div className="card" key={o.id} onClick={() => setOpen(o.id)} style={{ cursor: 'pointer' }}>
            <div className="item">
              <div className="item-body">
                <div className="item-name">Order #{o.id} · Table {o.table_number}</div>
                <div className="item-meta" style={{ marginTop: 6 }}>
                  <span className={'status ' + o.status}>{o.status}</span>
                  {late && <span className="pill" style={{ background: '#FFE2D8', color: '#E04A05' }}>overdue</span>}
                  {Number(o.complaint_count) > 0 &&
                    <span className="pill" style={{ background: '#FFE2D8', color: '#E04A05' }}>
                      {o.complaint_count} complaint{o.complaint_count > 1 ? 's' : ''}</span>}
                  {o.rating_score && <span className="pill">{'★'.repeat(o.rating_score)}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="price">{naira(o.total_amount)}</div>
                <div className="muted" style={{ fontSize: '.8rem' }}>{o.wait_minutes} min</div>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

function WaiterOrder({ id, onBack }) {
  const [order, setOrder] = useState(null)
  const [staff, setStaff] = useState([])
  const [chef, setChef] = useState('')
  const [bartender, setBartender] = useState('')
  const [waiter, setWaiter] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/orders/' + id).then(r => r.json()).then(o => {
    setOrder(o)
    setChef(o.chef_id || ''); setBartender(o.bartender_id || ''); setWaiter(o.waiter_id || '')
  })
  useEffect(() => { load(); fetch('/api/staff').then(r => r.json()).then(setStaff) }, [id])

  if (!order) return <div className="empty">Loading…</div>

  const hasDrinks = order.items.some(i => i.category === 'drink')
  const hasFood = order.items.some(i => i.category !== 'drink')

  async function save(served) {
    const res = await fetch(`/api/orders/${id}/assign`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waiter_id: waiter ? Number(waiter) : null,
        chef_id: chef ? Number(chef) : null,
        bartender_id: bartender ? Number(bartender) : null,
        mark_served: served
      })
    })
    setMsg(res.ok ? (served ? 'Marked as served.' : 'Saved.') : 'Could not save')
    load()
  }

  const pick = role => staff.filter(s => s.role === role)

  return (
    <>
      <button className="btn ghost" onClick={onBack}>← All orders</button>
      <h1 style={{ marginTop: 16 }}>Order #{order.id}</h1>
      <p className="muted">
        Table {order.table_number} · <span className={'status ' + order.status}>{order.status}</span> · {order.wait_minutes} min estimate
      </p>

      <div className="card">
        {order.items.map((it, n) => (
          <div className="row" key={n}>
            <span>{it.quantity} × {it.name} <span className="pill">{it.category}</span></span>
            <span className="price">{naira(Number(it.unit_price) * it.quantity)}</span>
          </div>
        ))}
        <div className="row"><strong>Total</strong><strong className="price">{naira(order.total_amount)}</strong></div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Who prepared this order</h3>

        <div className="field">
          <label>Waiter</label>
          <select value={waiter} onChange={e => setWaiter(e.target.value)}>
            <option value="">Select a waiter</option>
            {pick('waiter').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Chef {!hasFood && <span className="muted">— no food on this order</span>}</label>
          <select value={chef} disabled={!hasFood} onChange={e => setChef(e.target.value)}>
            <option value="">Select a chef</option>
            {pick('chef').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Bartender {!hasDrinks && <span className="muted">— no drinks on this order</span>}</label>
          <select value={bartender} disabled={!hasDrinks} onChange={e => setBartender(e.target.value)}>
            <option value="">Select a bartender</option>
            {pick('bartender').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {msg && <div className="banner pretend">{msg}</div>}

        <button className="btn ghost full" onClick={() => save(false)}>Save</button>
        <button className="btn primary full" style={{ marginTop: 8 }}
          disabled={order.status === 'served' || order.status === 'paid'}
          onClick={() => save(true)}>
          {order.status === 'served' || order.status === 'paid' ? 'Already served' : 'Mark as served'}
        </button>
      </div>

      {order.complaints.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Complaints</h3>
          {order.complaints.map(c => (
            <div className="row" key={c.id}>
              <span>{c.reason}</span><span className="pill">{c.status}</span>
            </div>
          ))}
        </div>
      )}

      {order.rating && (
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Rating</h3>
          <div className="row">
            <span style={{ color: 'var(--turmeric)', fontSize: '1.2rem' }}>{'★'.repeat(order.rating.score)}</span>
            <span className="muted">{order.rating.comment}</span>
          </div>
        </div>
      )}
    </>
  )
}
