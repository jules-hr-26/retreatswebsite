#!/usr/bin/env bash
set -euo pipefail

# Uses only a new local cluster. No Supabase credentials or production connection.
repo_root=$(cd "$(dirname "$0")/.." && pwd)
for command in initdb pg_ctl psql; do command -v "$command" >/dev/null; done
db_test_dir=$(mktemp -d "${TMPDIR:-/tmp}/retreats-db-test.XXXXXX")
cleanup() {
  pg_ctl -D "$db_test_dir/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$db_test_dir"
}
trap cleanup EXIT
initdb -D "$db_test_dir/data" -U postgres -A trust --no-locale >/dev/null
# Unix socket only, in the unique temporary directory; no TCP listener.
pg_ctl -D "$db_test_dir/data" -l "$db_test_dir/server.log" -o "-F -k $db_test_dir -h ''" -w start >/dev/null
db=(psql -X -q -v ON_ERROR_STOP=1 -h "$db_test_dir" -U postgres -d postgres)
"${db[@]}" <<'SQL'
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
GRANT USAGE, CREATE ON SCHEMA public TO PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
-- Model the existing Supabase event trigger, which must survive grant changes.
CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table') AND schema_name = 'public'
  LOOP EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', cmd.object_identity); END LOOP;
END;
$$;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO') EXECUTE FUNCTION public.rls_auto_enable();
SQL
"${db[@]}" -f "$repo_root/supabase/schema.sql"
for migration in "$repo_root"/supabase/migrations/*.sql; do
  "${db[@]}" -1 -f "$migration"
done
# Permission changes must also be safe to repeat.
"${db[@]}" -1 -f "$repo_root"/supabase/migrations/*_lock_down_database_defaults.sql
"${db[@]}" -f "$repo_root/tests/database-security.sql"
if [[ -n "${SCHEMA_SNAPSHOT_PATH:-}" ]]; then
  "${db[@]}" -Atc "SELECT jsonb_agg(row_to_json(t)) FROM (SELECT table_name, jsonb_agg(jsonb_build_object('name',column_name,'type',data_type,'nullable',is_nullable,'default',column_default) ORDER BY column_name) AS columns FROM information_schema.columns WHERE table_schema='public' GROUP BY table_name ORDER BY table_name) t" > "$SCHEMA_SNAPSHOT_PATH"
fi
echo 'Database checks passed: fresh install, client denial, backend CRUD/RPC, safe defaults, and automatic RLS.'
