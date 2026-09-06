# Chowly — build notes

Working notes kept during the build. Records what was done, why, and who
decided what.

**Key**
- **[Mine]** — my own idea or design decision
- **[Asked]** — something I prompted Claude to build or explain
- **[Claude — kept]** — Claude's suggestion that I accepted
- **[Claude — rejected]** — Claude's suggestion that I turned down, and why
- **[Fixed]** — something Claude got wrong that I caught and corrected

## Thursday 3 September

### Database schema
**[Asked]** Cut my 11-entity architecture model down to what the build
actually needs.

**[Claude — rejected]** It proposed six tables, merging Complaint and Rating
into one `feedback` table. **[Mine]** I refused. My model had Complaint as
1:M and Rating as 1:1 against Order, and collapsing them would have lost that
distinction. Kept them separate — seven tables.

**[Claude — rejected]** It also flattened `ItemType.PreparedByRoleID` into a
plain food/drink split, throwing away the rule that food and dessert go to
the chef and drinks to the bartender. **[Mine]** Kept that logic.

### Why the schema is written the way it is
**[Claude — kept]** Constraints I hadn't thought to add, accepted once
explained:
- UNIQUE on ratings.order_id and payments.order_id enforces my 1:1 in the
  database, not just on the diagram. complaints has no UNIQUE — that is how
  the 1:M is expressed.
- CHECK constraints on status, role and category, so invalid values are
  refused at insert time.
- ON DELETE CASCADE so deleting an order takes its items with it.
- unit_price copied onto order_items rather than read live, so changing a
  price later doesn't rewrite what past customers paid.

### Problems hit
**[Fixed]** postgres password rejected repeatedly — the username had been
typed `postgre`, missing the s.

**[Fixed]** Ran `export PGPASSWORD='your_postgres_password_here'` with
Claude's placeholder text still in it, which stopped psql prompting at all.
Cleared with `unset PGPASSWORD`.

**[Mine]** Caught that `.gitignore` hadn't been created before `npm install`
ran, and made it before committing, so node_modules was never tracked. On the
previous lab this went wrong and 760 files had to be removed afterwards.

### API
**[Asked]** Build the Express API — menu, orders, complaints, ratings,
payment.

**[Fixed]** Claude gave server.js in three parts and the joins between them
broke — SyntaxError at line 104. **[Mine]** Asked for the whole file instead.

**[Claude — kept]** When giving the full file it reordered the routes,
putting GET /api/orders above GET /api/orders/:id, because Express matches in
order and the wildcard would otherwise swallow the plain request.

### Testing the waiting time
**[Mine]** Predicted the result before running it. Ordered 2x Jollof (25 min,
food) and 1x Chapman (8 min, drink). Expected max(50, 8) + 5 = 55 minutes,
not 50 + 8 + 5 = 63, because the kitchen and bar work at the same time. API
returned 55 and a total of 41,000. Correct.

Note: those figures were from the original 25-45 minute prep times. Later cut
to 2-12 minutes with the buffer removed — see Sunday.

## Friday 4 September

### Front end
**[Asked]** Build the React front end.

**[Claude — kept]** Structure: a single App.jsx holding the components, with
a centred container capped at 720px so it fills a phone screen and centres on
a laptop. Colours as CSS variables in one place.

**[Mine]** Mobile-first was my requirement — the customer's real context is a
phone at a table, not a desktop.

**[Mine]** I changed the colours and font sizes repeatedly by hand, testing
them in the browser rather than accepting what was suggested. Most of what
Claude proposed first was too muted, or sized wrongly.

**[Fixed]** Vite appeared to fail with ERR_CONNECTION_REFUSED. The server had
started and then stopped, because I pressed a key in its terminal. A running
dev server holds the window with no prompt.

**[Fixed]** localhost:5173 would not open on my phone. localhost means "this
machine", so the phone was looking at itself.

### Friday evening — first user test
**[Mine]** Gave the working app to my mum, as a first real user who had not
seen it being built. Her feedback:

1. The role switch is confusing — she could see the waiter's view.
2. Add a cart.
3. Add a delivery option.
4. More menu items — water, soft drinks, wine, more variety.
5. VAT and service charge, as Nigerian restaurants show on a bill.
6. The design looks plain — she wanted a logo, icons and images.

**[Mine]** What I decided:
- **Role switch** — kept, because the brief requires both roles, but
  redesigned entirely.
- **Cart** — already existed; she didn't notice it, which meant it needed to
  be clearer.
- **Delivery** — rejected. The brief describes a customer at a table paying
  before leaving. Delivery contradicts the story rather than extending it.
- **More items, VAT, service charge, logo, images** — all adopted.

### Landing page
**[Mine]** My design: a landing page with two large buttons, "I'm dining" and
"Staff", so the customer picks a door and stays in it. Came from my mum's
objection and from my own view that a toggle at the top looked wrong.

**[Asked]** Build it. **[Mine]** Then changed the layout myself several times
— icon beside the title rather than above it, icon size, button padding, and
the "Continue →" call to action at the bottom of each card.

### Logo
**[Claude — rejected]** It generated an SVG logo — a chef's hat beside the
wordmark. **[Mine]** I rejected it and made my own: an outlined chef's hat
tilted off the C, brown wordmark with "ly" in orange.

**[Mine]** Having a real logo changed the palette. The original colours were
guesses; the real brand colours come from my logo — #FF5A0F orange and
#5A2D10 brown. Updated the CSS variables so the app follows the logo.

**[Mine, tried and rejected]** Floating food icons in the background, and a
neon colour scheme. I asked for both, saw them, and dropped them — neither
worked against food photography.

**[Claude — kept]** Its argument that warm neutrals let the food be the
loudest thing on screen, which is what restaurant apps actually do.

### Problem: partial file edits kept destroying code
**[Fixed]** Claude twice gave a replacement for one function rather than the
whole file. Both times the surrounding code was lost when pasted.

The second was worse: replacing the App function silently deleted Menu,
OrderStatus, WaiterView and WaiterOrder — the entire application. The page
went blank with "Landing is not defined", pointing at the wrong thing.

**[Mine]** Diagnosed it with:

    grep -n "function" client/src/App.jsx

Three functions where there should have been seven.

**[Mine]** From then on I insisted on whole files whenever a change touched
more than a few lines.

## Saturday 5 September — design day, no code

**[Mine]** No commits on this day, deliberately. I spent it away from the
keyboard: sketching screens on paper, working out the menu structure, and
giving the app to more people around me to try.

What came out of it:
- The seven-category menu structure, with small chops folded into starters
  and drinks split alcoholic and non-alcoholic.
- The decision to list allergens specifically rather than as one generic
  field, so the data could later be filtered.
- Prep times capped at 12 minutes, so the whole order lifecycle can be
  demonstrated in a short session.
- VAT and service charge as a proper bill breakdown.
- The table dropdown with capacities, rather than typing a number.
- The takeaway option.
- Photographing the 75 dishes myself.

Testing with other people also surfaced things my mum hadn't mentioned —
mainly that the menu was too long to scroll and needed collapsing, and that
it was not obvious what a customer should do after ordering.

I also held off deploying, because I wasn't confident in the design yet and
didn't want to publish something I was still changing.

## Sunday 6 September

### Menu restructure
**[Asked]** Build the seven-category structure I designed on Saturday.

**[Claude — rejected]** It proposed twelve categories. **[Mine]** Too many
sections with two items each; cut to seven.

**[Claude — rejected]** It also proposed a wait-time formula using only the
slowest single item, which would have dropped both quantity and the
kitchen/bar split. **[Mine]** Kept my own formula and rescaled the numbers.

**[Mine]** Picked the international dishes myself and specified the allergen
list for every item.

### Migration rather than editing the schema
**[Claude — kept]** Writing server/migration.sql as a separate file rather
than changing schema.sql. schema.sql describes a fresh database; the
migration changes an existing one that already holds data.

The CHECK constraint refused the migration first time, because existing rows
still said 'food' and 'drink'. That is the constraint doing its job — it
blocked a change that would have left invalid data.

### Bugs found by using the app
**[Mine]** **Payment came before serving.** You could pay the moment you
ordered, which contradicts the brief. Asked for a guard rejecting payment on
anything not yet served. A correctness fix, not a feature.

**[Mine]** **Switching roles lost the customer's order.** Found by switching
to staff and back. Asked for it to be fixed, and for a way to move between
the menu and the order.

**[Mine]** **The countdown kept running after the food arrived.** A customer
whose food had been delivered was still watching a timer. Asked for it to
stop and be replaced with a served panel.

**[Mine]** **"Arrived on time" showed for late orders.** Math.round on
minutes turned anything under 30 seconds late into "0 min late", which the
condition read as on time. Spotted it, asked for seconds instead.

All four found by using the app rather than reading the code.

### Other decisions
**[Mine]** Removed the 2-minute service buffer. A bottle of water showed a
4-minute wait, which felt wrong. The estimate is now prep time only.

**[Mine]** Charges appear at review, not in the cart bar — the cart shows
what the food costs, the bill shows what you pay.

**[Mine]** Takeaway moved from the waiter's screen to the customer's payment
screen. The customer knows whether they want leftovers packed.

**[Mine]** Table dropdown simplified from "Table 1 · seats 2" to "Table 1",
with the capacity appearing underneath once chosen.

**[Mine]** Menu categories start collapsed, each with its own colour.

**[Mine]** Spotted Piña Colada misspelled in the seed data. Fixed.

**[Claude — kept]** VAT and service calculated on the server, never sent from
the browser — same reasoning as prices.

**[Claude — kept]** Rating gated until served, complaints not. I wanted both
gated; Claude pointed out the brief describes complaining about a delay,
which happens while still waiting, and that this is exactly why my model made
complaints 1:M and ratings 1:1. I agreed.

### Features scoped and deliberately left out
**Reservations.** **[Mine]** I wanted table booking. **[Claude — kept]** It
argued this sits outside the brief's story — every requirement starts with a
customer already at a table, and the brief insists on the entire story. Left
out.

**Voice ordering.** **[Mine]** I wanted a conversational assistant so a blind
customer could order without seeing the screen. **[Claude — kept]** Reading
the menu aloud is cheap; voice input is not — speech recognition, intent
parsing, mishearing, confirmations. And a blind user already has a screen
reader far better than anything I would build. The effort went into
aria-labels on the star rating, aria-live on the countdown, labels tied to
inputs, and status conveyed as text rather than colour alone.

### Images
**[Mine]** 75 photos, my own, in client/public/menu, linked with
server/images.sql.

**[Claude — rejected]** It offered to hotlink images from a recipe blog.
**[Mine]** Refused — using someone's work without a licence, and the links
could break at any time. Local files deploy with the app.

### Deployment
**[Claude — kept]** db.js and the Express static-file lines had been written
for deployment from the start, so no code changes were needed on the day —
only creating the Render services and loading the schema.

**[Fixed]** The connection string pasted into Git Bash picked up a
bracketed-paste marker (^[[200~), which broke the URL. psql fell back to the
Windows username and reported "password authentication failed for user DELL"
— pointing at the wrong thing. Repasting cleanly fixed it.

**[Fixed]** After deploying, the live site broke because the migration and
reseed had only been run against the local database. Ran both against Render
as well.

### Reflection on working with AI
The pattern that worked mechanically: ask for whole files, not fragments.
Every partial edit lost surrounding code, twice catastrophically.

The pattern that mattered more: the AI was reliably useful for writing code
and reliably wrong about my own design. It proposed merging two tables my
model deliberately separated, suggested a formula that dropped my parallel
kitchen logic, generated a logo I didn't want, and offered images I couldn't
licence. Each correction came from knowing what I had designed and why.

It was right when I was wrong — about reservations sitting outside the brief,
about complaints needing to be available before serving, and about what a
blind user actually needs.

Saturday was the most useful day and produced no code at all. Sketching the
menu on paper and watching other people use the app decided more than any
prompt did.

The design is mine throughout. The colours, font sizes, landing page layout,
menu structure, logo, photographs and the decisions about what to leave out
were all mine, adjusted by hand and by eye until they looked right.