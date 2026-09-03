# Chowly — build notes

## Thursday 3 September

### Database schema
Asked Claude to cut my 11-entity architecture model down to what the
build actually needs. It proposed six tables and merging Complaint and
Rating into one `feedback` table.

I rejected the merge. My model had Complaint as 1:M and Rating as 1:1
against Order, and collapsing them would have lost that distinction.
Kept them as separate tables. Ended up with seven tables.

Claude also flattened `ItemType.PreparedByRoleID` into a plain
food/drink split, which would have thrown away the rule that food and
dessert go to the chef and drinks go to the bartender. Kept three
categories instead.

### Why the schema is written the way it is
- UNIQUE on ratings.order_id and payments.order_id enforces 1:1 in the
  database, not just on the diagram. complaints has no UNIQUE, which is
  how the 1:M is expressed.
- CHECK constraints on status, role and category so invalid values are
  refused at insert time.
- ON DELETE CASCADE so deleting an order takes its items with it.
- unit_price copied onto order_items rather than read live, so changing
  a menu price later doesn't rewrite what past customers paid.

### Problems hit
- postgres password rejected repeatedly — the username was typed as
  `postgre`, missing the s.
- Ran `export PGPASSWORD='your_postgres_password_here'` with Claude's
  placeholder text still in it, which stopped psql prompting at all.
  Fixed with `unset PGPASSWORD`.
- `.gitignore` had not been created before `npm install` ran. Caught it
  before committing, so node_modules was never tracked. On the previous
  lab this went wrong and 760 files had to be removed with
  `git rm --cached`.

### API
Claude gave server.js in three parts and the joins between them broke —
SyntaxError, missing bracket at line 104. Replaced the whole file in one
paste instead.

Claude also reordered the routes when giving the full file, putting
GET /api/orders above GET /api/orders/:id, because Express matches in
order and the wildcard would otherwise swallow the plain request.

### Testing the waiting time
Predicted the result before running it. Ordered 2x Jollof (25 min, food)
and 1x Chapman (8 min, drink). Expected max(50, 8) + 5 = 55 minutes,
not 50 + 8 + 5 = 63, because the kitchen and bar work at the same time.
API returned wait_minutes 55 and total 41,000. Correct.
### Front end
Built the React front end as a single App.jsx holding six components:
the role switch, menu, checkout, order status, waiter list and waiter
detail.

Design decisions:
- Mobile-first, because the customer's real context is a phone at a
  table. Layout uses a centred container capped at 720px, so it fills
  the screen on a phone and centres with margins on a laptop rather
  than stretching the menu across a whole monitor.
- Colours set as CSS variables in one place, so the palette can be
  changed without hunting through the stylesheet. Warm food palette:
  paprika, turmeric, herb green, cream.
- Fraunces for headings, Inter for body text.
- The cart bar is fixed to the bottom of the screen, where a thumb
  rests on a phone.

Problems hit:
- Vite dev server appeared to fail with ERR_CONNECTION_REFUSED. The
  server had actually started and then stopped, because I pressed a key
  in the terminal window. A running dev server holds the window with no
  prompt; a $ prompt means it has exited.
- localhost:5173 would not open on my phone. localhost means "this
  machine", so the phone was looking at itself. Needs `npm run dev --
  --host` and the network address, or waiting until deployment.
## Thursday evening — user feedback

Gave the working app to my mum to try, as a first real user who had not
seen it being built. Her feedback:

1. **The role switch is confusing.** She could see the waiter's view by
   tapping a button at the top, and said that was strange for an app a
   customer uses.
2. **Add a cart.** She wanted to see what she had selected before
   ordering.
3. **Add a delivery option.**
4. **More menu items** — water, soft drinks, wine, and more variety in
   both food and drinks.
5. **VAT and service charge**, as Nigerian restaurants show on a bill.

### What I decided

**Keeping the role switch, but making it less prominent.** The brief
requires a way to act as both customer and waiter, and says a simple
switch is enough, so removing it would fail a requirement. Instead I
will make it smaller and label it as a staff view so it reads as a
demonstration control rather than a customer feature.

**The cart already exists** — the bar at the bottom of the menu showing
the item count and total, and the review screen before placing the
order. She did not notice it, which is useful in itself: it needs to be
more obvious.

**Not adding delivery.** The brief describes a customer at a table who
pays just before leaving the restaurant. Delivery would contradict that
story rather than extend it.

**Adding more menu items.** Costs nothing and makes the menu feel like a
real restaurant.

**Adding VAT and service charge.** This is the strongest suggestion.
Nigerian restaurants charge 7.5% VAT and often a service charge, so
showing a subtotal, VAT, service charge and total makes the payment
screen behave like a real bill instead of a single figure.
6. **The design looks plain.** She wanted a logo, icons and images.
**Adding a logo and food images.** Fair point — the menu is text only,
and a restaurant menu with no pictures of the food is unusual. Adding a
Chowly wordmark and images to the menu items is the single change that
would most improve first impressions, and the brief awards bonus marks
for an application that is beautifully designed and well presented.