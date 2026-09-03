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
