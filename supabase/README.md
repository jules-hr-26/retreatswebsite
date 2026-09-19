# Database setup

`schema.sql` is the authoritative baseline for a new, empty database.
Run it once, then apply the SQL files in `migrations/` in filename order.
For an existing database, apply only migrations not already recorded.
The root `supabase-schema.sql` is retired and intentionally contains no SQL.

Production project: `hibxcsspectqtalppfoo` (cnlc-platform).
All application tables are server-only: RLS enabled, no public policies, and
no table grants for `anon` or `authenticated`. Only server functions use the
service role. Never expose the service key in browser code.

Session migration invalidates old session cookies and previously issued links.
Users sign in again through their inbox. Sign-in links expire after 15 minutes;
sessions expire after 7 inactive days with a 30-day absolute limit.

Verify RLS and grants after every schema change, and run `node --test tests/*.test.mjs`
before deploying API changes. Apply database migrations before dependent code.
