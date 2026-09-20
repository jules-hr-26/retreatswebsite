-- This application's public schema is server-only. Remove every client
-- privilege, including TRUNCATE/REFERENCES/TRIGGER (which are not CRUD).
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_login_attempt(text, text) TO service_role;

-- rls_auto_enable(), when present, is a platform-created event-trigger
-- function. Its owner retains execution; API roles never need to call it.
-- Preserve the trigger and its automatic RLS protection.

-- Scope table/sequence defaults to the application schema and migration owner.
-- Future migrations must explicitly grant the backend the privileges they need.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;

-- PostgreSQL grants function execution to PUBLIC globally by default. A
-- schema-only REVOKE cannot override that global grant, so revoke it here too.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Do not grant CREATE to API roles; schema USAGE alone is not table access.
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
