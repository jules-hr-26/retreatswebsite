# Database setup

`schema.sql` plus the ordered files in `migrations/` are the authoritative,
version-controlled database definition. The root `supabase-schema.sql` is retired
and intentionally contains no executable SQL.

For a new, empty Supabase database, run the baseline once as `postgres`, then
apply all migrations with the Supabase migration runner so their versions are
recorded. The baseline creates the original application tables; later migrations
add sessions, notification preferences, rate limiting, and permission hardening.
Do not run the baseline against an existing database.

For production, compare the migration history first and apply only unapplied
versions. The filenames match production's recorded versions. The four initial
files were renamed after comparing their complete SQL with the migration history;
their SQL was not changed or rerun. If applying through MCP assigns a new version,
use the version returned by `list_migrations` for that local file before committing.
Never mark a migration as applied unless its SQL was actually applied and verified.

Production project: `hibxcsspectqtalppfoo` (cnlc-platform).
All application tables are server-only: RLS enabled, no public policies, and
no table or column grants for `PUBLIC`, `anon`, or `authenticated`. Only server
functions use the service role. It has table CRUD and the specific login-rate-limit
RPC grant, without table truncation, trigger creation, or schema creation. Never
expose the service key in browser code.

New objects created by the `postgres` migration account have no automatic API-role
grants. Each future migration must enable RLS and explicitly grant only the backend
access it requires. Supabase-managed `supabase_admin` defaults are platform-owned;
this change does not modify them. Recheck permissions after platform operations
that create or restore objects.

The existing `rls_auto_enable()` event trigger is maintained by Supabase. Its
owner can still execute it; public API roles cannot. A fresh database does not
need this platform helper to run the baseline, which explicitly enables RLS.
Supabase's informational "RLS enabled, no policy" notices are intentional here:
direct client access is denied, and the Vercel APIs authorize all application calls.

Session migration invalidates old session cookies and previously issued links.
Users sign in again through their inbox. Sign-in links expire after 15 minutes;
sessions expire after 7 inactive days with a 30-day absolute limit.

Run these checks before committing database changes:

```sh
node --test tests/*.test.mjs
bash tests/test-database.sh
```

The database test requires local PostgreSQL tools (`initdb`, `pg_ctl`, `psql`). It
creates and removes an isolated local cluster with a private Unix socket, uses
fake data, and never connects to Supabase. It tests the complete fresh-install
sequence, client denial, backend CRUD/RPC, future-object defaults, and continued
automatic RLS behavior. It also repeats the permissions migration for idempotency.

After deployment, run the read-only assertions in `check-security.sql` against the
target database and inspect Supabase's security advisors. Verify migration history
matches the repository. Apply database migrations before dependent API changes.
