-- Read-only assertions for this project's server-only public schema.
-- Run as the database owner with psql -v ON_ERROR_STOP=1 -f this-file.sql.
DO $check$
DECLARE
  item record;
  client_role text;
  privilege text;
  expected_table text;
BEGIN
  FOREACH expected_table IN ARRAY ARRAY[
    'admins', 'alumni_allowlist', 'app_sessions', 'audit_log', 'events',
    'event_attendees', 'forum_memberships', 'forum_posts', 'forum_replies',
    'login_rate_limits', 'login_tokens', 'members', 'offerings',
    'proposed_events', 'site_settings'
  ] LOOP
    IF to_regclass('public.' || expected_table) IS NULL THEN
      RAISE EXCEPTION 'Missing application table: %', expected_table;
    END IF;
  END LOOP;

  FOR item IN
    SELECT c.oid, c.relname, c.relkind, c.relrowsecurity
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm')
  LOOP
    IF item.relkind IN ('r', 'p') AND NOT item.relrowsecurity THEN
      RAISE EXCEPTION 'RLS is disabled: %', item.relname;
    END IF;
    FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF has_table_privilege(client_role, item.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        OR has_any_column_privilege(client_role, item.oid, 'SELECT,INSERT,UPDATE,REFERENCES') THEN
        RAISE EXCEPTION 'Unexpected client privilege: % on %', client_role, item.relname;
      END IF;
    END LOOP;
    FOREACH privilege IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
      IF NOT has_table_privilege('service_role', item.oid, privilege) THEN
        RAISE EXCEPTION 'Missing backend privilege: % on %', privilege, item.relname;
      END IF;
    END LOOP;
    IF has_table_privilege('service_role', item.oid, 'TRUNCATE,REFERENCES,TRIGGER') THEN
      RAISE EXCEPTION 'Excess backend privilege on %', item.relname;
    END IF;
  END LOOP;

  FOR item IN SELECT p.oid, p.proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'
  LOOP
    IF has_function_privilege('anon', item.oid, 'EXECUTE')
      OR has_function_privilege('authenticated', item.oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'Client can execute internal function: %', item.proname;
    END IF;
  END LOOP;
  IF NOT has_function_privilege('service_role', 'public.consume_login_attempt(text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Backend cannot execute login rate limiter';
  END IF;
  FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF has_schema_privilege(client_role, 'public', 'CREATE') THEN
      RAISE EXCEPTION 'API role can create schema objects: %', client_role;
    END IF;
  END LOOP;
END;
$check$;
