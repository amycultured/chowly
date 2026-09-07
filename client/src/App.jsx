import { useState, useEffect } from 'react'

const naira = n => '₦' + Number(n).toLocaleString('en-NG')

const CATEGORIES = [
  ['starters',      'Starters',       'cat-starters'],
  ['nigerian',      'Nigerian Mains', 'cat-nigerian'],
  ['international', 'International',  'cat-international'],
  ['sides',         'Sides',          'cat-sides'],
  ['desserts',      'Desserts',       'cat-desserts'],
  ['non-alcoholic', 'Non-Alcoholic',  'cat-soft'],
  ['alcoholic',     'Alcoholic',      'cat-booze'],
]

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('chowly_role') || null)
  const [orderId, setOrderId] = useState(() => {
    const saved = localStorage.getItem('chowly_order_id')
    return saved ? Number(saved) : null
  })
  const [view, setView] = useState(() => localStorage.getItem('chowly_view') || 'menu')

  useEffect(() => {
    if (role) localStorage.setItem('chowly_role', role)
    else localStorage.removeItem('chowly_role')
  }, [role])

  useEffect(() => {
    if (orderId) localStorage.setItem('chowly_order_id', String(orderId))
    else localStorage.removeItem('chowly_order_id')
  }, [orderId])

  useEffect(() => {
    localStorage.setItem('chowly_view', view)
  }, [view])

  if (!role) return <Landing onPick={setRole} />

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand" onClick={() => setRole(null)} style={{ cursor: 'pointer' }}>
            <Logo />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {role === 'customer' && orderId && (
              <button className="btn ghost" style={{ padding: '7px 14px', fontSize: '.85rem' }}
                      onClick={() => setView(view === 'menu' ? 'order' : 'menu')}>
                {view === 'menu' ? `Order #${orderId}` : 'Menu'}
              </button>
            )}
            <button className="btn ghost" style={{ padding: '7px 14px', fontSize: '.85rem' }}
                    onClick={() => setRole(role === 'customer' ? 'waiter' : 'customer')}>
              {role === 'customer' ? 'Staff' : 'Dining'}
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        {role === 'customer'
          ? ((orderId && view === 'order')
              ? <OrderStatus id={orderId}
                             onBrowse={() => setView('menu')}
                             onNew={() => { setOrderId(null); setView('menu') }} />
              : <Menu onPlaced={id => { setOrderId(id); setView('order') }} />)
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
  const Arrow = () => (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="landing-brand"><Logo height={150} /></div>
        <p className="landing-tag">Order from your table. Pay when you're done.</p>

        <div className="doors">
          <button className="door dine" onClick={() => onPick('customer')}>
            <span className="door-head">
              <span className="door-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 3v7a3 3 0 0 0 3 3v8M7 3v6M10 3v6M17 3c-1.5 2-2 4-2 7 0 1.7 1 3 2 3v8"
                        stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="door-title">I'm dining</span>
            </span>
            <span className="door-sub">Browse the menu and place an order</span>
            <span className="door-cta">Continue <Arrow /></span>
          </button>

          <button className="door staff" onClick={() => onPick('waiter')}>
            <span className="door-head">
              <span className="door-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z" stroke="currentColor"
                        strokeWidth="1.9" strokeLinejoin="round" />
                  <path d="M9.5 7h5M9.5 11h5M9.5 15h3" stroke="currentColor"
                        strokeWidth="1.9" strokeLinecap="round" />
                </svg>
              </span>
              <span className="door-title">Staff</span>
            </span>
            <span className="door-sub">Assign orders and mark them served</span>
            <span className="door-cta">Continue <Arrow /></span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- CUSTOMER: MENU + CART ---------------- */

function Menu({ onPlaced }) {
  const [items, setItems] = useState([])
  const [tables, setTables] = useState([])
  const [cart, setCart] = useState({})
  const [table, setTable] = useState('')
  const [openCat, setOpenCat] = useState(null)
  const [checkout, setCheckout] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then(setItems).catch(() => setError('Could not load the menu'))
    fetch('/api/tables').then(r => r.json()).then(setTables).catch(() => {})
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

  const subtotal = lines.reduce((s, l) => s + Number(l.price) * l.quantity, 0)
  const vat = subtotal * 0.075
  const service = subtotal * 0.05
  const total = subtotal + vat + service
  const count = lines.reduce((s, l) => s + l.quantity, 0)
  const chosen = tables.find(t => t.table_number === Number(table))

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
          <div className="row"><span className="muted">Subtotal</span><span>{naira(subtotal)}</span></div>
          <div className="row"><span className="muted">VAT (7.5%)</span><span>{naira(vat)}</span></div>
          <div className="row"><span className="muted">Service charge (5%)</span><span>{naira(service)}</span></div>
          <div className="row"><strong>Total</strong><strong className="price">{naira(total)}</strong></div>
        </div>

        <div className="card">
          <div className="field">
            <label htmlFor="table">Which table are you at?</label>
            <select id="table" value={table} onChange={e => setTable(e.target.value)}>
              <option value="">Choose your table</option>
              {tables.map(t => (
                <option key={t.table_number} value={t.table_number}>{t.label}</option>
              ))}
            </select>
            {chosen && (
              <p className="muted" style={{ marginTop: 6, marginBottom: 0 }}>
                Seats up to {chosen.seats} people
              </p>
            )}
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

  return (
    <>
      <h1>What are you having?</h1>
      <p className="muted">Everything is prepared to order. Times are a guide.</p>
      {error && <div className="banner pretend">{error}</div>}

      {CATEGORIES.map(([key, label, colour]) => {
        const group = items.filter(i => i.category === key)
        if (!group.length) return null
        const isOpen = openCat === key
        return (
          <section key={key} className="cat">
            <button className={`cat-head ${colour} ${isOpen ? 'open' : ''}`}
                    onClick={() => setOpenCat(isOpen ? null : key)}
                    aria-expanded={isOpen}>
              <span className="cat-name">{label}</span>
              <span className="cat-right">
                <span className="cat-count">{group.length}</span>
                <svg className="cat-chev" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div className="cat-body">
                {group.map(item => (
                  <div className="card item" key={item.id}>
                    {item.image_url && (
                      <img className="item-img" src={item.image_url} alt={item.name}
                           onError={e => { e.target.style.display = 'none' }} />
                    )}
                    <div className="item-body">
                      <div className="item-name">{item.name}</div>
                      <div className="item-desc">{item.description}</div>
                      <div className="item-meta">
                        <span className="price">{naira(item.price)}</span>
                        <span className="pill time">{item.prep_minutes} min</span>
                      </div>
                      {item.allergens?.length > 0 && (
                        <div className="allergens">
                          <span className="allergens-label">Contains</span>
                          {item.allergens.map(a => <span className="pill allergen" key={a}>{a}</span>)}
                        </div>
                      )}
                    </div>
                    {cart[item.id]
                      ? <div className="qty">
                          <button onClick={() => sub(item.id)} aria-label={'Remove one ' + item.name}>−</button>
                          <span>{cart[item.id]}</span>
                          <button onClick={() => add(item.id)} aria-label={'Add one ' + item.name}>+</button>
                        </div>
                      : <button className="btn ghost" onClick={() => add(item.id)}>Add</button>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}

      {count > 0 && (
        <div className="cartbar">
          <div className="cartbar-inner">
            <div>
              <div style={{ fontWeight: 600 }}>{count} item{count > 1 ? 's' : ''}</div>
              <div className="price">{naira(subtotal)}</div>
            </div>
            <button className="btn primary" onClick={() => setCheckout(true)}>Review order</button>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------------- CUSTOMER: ORDER STATUS ---------------- */

function OrderStatus({ id, onBrowse, onNew }) {
  const [order, setOrder] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [reason, setReason] = useState('')
  const [takeaway, setTakeaway] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/orders/' + id).then(r => r.json()).then(setOrder)
  useEffect(() => { load() }, [id])
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    const p = setInterval(load, 8000)
    return () => { clearInterval(t); clearInterval(p) }
  }, [id])

  if (!order) return <div className="empty">Loading your order…</div>

  const ready = new Date(order.placed_at).getTime() + order.wait_minutes * 60000
  const left = Math.round((ready - now) / 1000)
  const over = left < 0
  const mm = Math.floor(Math.abs(left) / 60)
  const ss = String(Math.abs(left) % 60).padStart(2, '0')
  const served = order.status === 'served' || order.status === 'paid'

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
            <button className="btn ghost" style={{ marginBottom: 14 }} onClick={onBrowse}>
        ← Browse the menu
      </button>

      {!served && (
        <div className={'timer' + (over ? ' over' : '')} aria-live="polite">
          <div className="value">{mm}:{ss}</div>
          <div className="label">{over ? 'delayed by' : 'estimated wait remaining'}</div>
        </div>
      )}

      {served && order.status !== 'paid' && (
        <div className="timer done">
          <div className="value">Served</div>
                   <div className="label">
            {(() => {
              const late = new Date(order.served_at).getTime() - ready
              if (!order.served_at || late <= 0) return 'arrived on time'
              const m = Math.floor(late / 60000)
              const s = Math.floor((late % 60000) / 1000)
              return m > 0
                ? `arrived ${m} min ${s} sec late`
                : `arrived ${s} sec late`
            })()}
          </div>
        </div>
      )}

      <div className="card">
        {order.items.map((it, n) => (
          <div className="row" key={n}>
            <span>{it.quantity} × {it.name}</span>
            <span className="price">{naira(Number(it.unit_price) * it.quantity)}</span>
          </div>
        ))}
        <div className="row"><span className="muted">Subtotal</span><span>{naira(order.subtotal)}</span></div>
        <div className="row"><span className="muted">VAT (7.5%)</span><span>{naira(order.vat)}</span></div>
        <div className="row"><span className="muted">Service charge (5%)</span><span>{naira(order.service_charge)}</span></div>
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
          {served ? (
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>How was it?</h3>
              <div className="stars" role="group" aria-label="Rating out of five">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} className={n <= score ? 'on' : ''} onClick={() => setScore(n)}
                          aria-label={n + ' star' + (n > 1 ? 's' : '')}
                          aria-pressed={n <= score}>★</button>
                ))}
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <textarea rows="2" value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Anything you'd like to add" aria-label="Rating comment" />
              </div>
              <button className="btn ghost full" disabled={!score}
                onClick={() => post('rating', { score, comment }, 'Thank you, your rating has been saved.')}>
                Submit rating
              </button>
            </div>
          ) : null}

          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Something wrong?</h3>
            <div className="field">
              <textarea rows="2" value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Tell us what happened" aria-label="Complaint" />
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
            {!served && (
              <p className="muted" style={{ marginTop: 0 }}>
                You pay on your way out. The bill unlocks once your order has been served.
              </p>
            )}
            {served && (
              <div className="field checkline" style={{ marginBottom: 14 }}>
                <input id="ta" type="checkbox" checked={takeaway}
                       onChange={e => setTakeaway(e.target.checked)} />
                <label htmlFor="ta" style={{ margin: 0 }}>Pack my leftovers to take away</label>
              </div>
            )}
            <button className="btn primary full" disabled={!served}
              onClick={() => post('payment', { method: 'card', takeaway }, 'Paid. Thank you.')}>
              {served ? `Pay ${naira(order.total_amount)}` : 'Waiting to be served'}
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
          <div className="row"><span className="muted">Subtotal</span><span>{naira(order.subtotal)}</span></div>
          <div className="row"><span className="muted">VAT (7.5%)</span><span>{naira(order.vat)}</span></div>
          <div className="row"><span className="muted">Service charge (5%)</span><span>{naira(order.service_charge)}</span></div>
          {order.takeaway && (
            <div className="row"><span className="muted">Leftovers</span><span>Packed to take away</span></div>
          )}
          <div className="row"><strong>Order #{order.id}, table {order.table_number}</strong>
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
                  {late && <span className="pill urgent">overdue</span>}
                  {Number(o.complaint_count) > 0 &&
                    <span className="pill urgent">
                      {o.complaint_count} complaint{o.complaint_count > 1 ? 's' : ''}</span>}
                  {o.rating_score && <span className="pill">{'★'.repeat(o.rating_score)}</span>}
                  {o.takeaway && <span className="pill">takeaway</span>}
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

  const fromBar = c => c === 'non-alcoholic' || c === 'alcoholic'
  const hasBar = order.items.some(i => fromBar(i.category))
  const hasKitchen = order.items.some(i => !fromBar(i.category))

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
            <span>{it.quantity} × {it.name} <span className="pill">{fromBar(it.category) ? 'bar' : 'kitchen'}</span></span>
            <span className="price">{naira(Number(it.unit_price) * it.quantity)}</span>
          </div>
        ))}
        <div className="row"><span className="muted">Subtotal</span><span>{naira(order.subtotal)}</span></div>
        <div className="row"><span className="muted">VAT + service</span>
          <span>{naira(Number(order.vat) + Number(order.service_charge))}</span></div>
        <div className="row"><strong>Total</strong><strong className="price">{naira(order.total_amount)}</strong></div>
        {order.takeaway && (
          <div className="row"><span className="muted">Leftovers</span><span>Packed to take away</span></div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Who prepared this order</h3>

        <div className="field">
          <label htmlFor="w">Waiter</label>
          <select id="w" value={waiter} onChange={e => setWaiter(e.target.value)}>
            <option value="">Select a waiter</option>
            {pick('waiter').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="c">Chef {!hasKitchen && <span className="muted">— nothing from the kitchen</span>}</label>
          <select id="c" value={chef} disabled={!hasKitchen} onChange={e => setChef(e.target.value)}>
            <option value="">Select a chef</option>
            {pick('chef').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="b">Bartender {!hasBar && <span className="muted">— nothing from the bar</span>}</label>
          <select id="b" value={bartender} disabled={!hasBar} onChange={e => setBartender(e.target.value)}>
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
