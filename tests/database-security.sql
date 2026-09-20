-- Disposable local database only: exercise PostgreSQL's permission enforcement.
\ir ../supabase/check-security.sql

CREATE TABLE public.future_private_table (id bigserial PRIMARY KEY, value text);
CREATE FUNCTION public.future_private_rpc() RETURNS integer LANGUAGE sql AS 'SELECT 1';

DO $check$
DECLARE client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF has_table_privilege(client_role, 'public.future_private_table', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      OR has_sequence_privilege(client_role, 'public.future_private_table_id_seq', 'SELECT,UPDATE,USAGE')
      OR has_function_privilege(client_role, 'public.future_private_rpc()', 'EXECUTE') THEN
      RAISE EXCEPTION 'New objects inherited unwanted grants for %', client_role;
    END IF;
  END LOOP;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.future_private_table'::regclass) THEN
    RAISE EXCEPTION 'The automatic RLS trigger stopped working';
  END IF;
END;
$check$;

-- Neither client role can read profiles, truncate them, or invoke internal RPCs.
SET ROLE anon;
DO $check$
BEGIN
  BEGIN PERFORM 1 FROM public.members; RAISE EXCEPTION 'Anonymous read allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN TRUNCATE public.members; RAISE EXCEPTION 'Anonymous truncate allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.consume_login_attempt(repeat('a',64), repeat('b',64)); RAISE EXCEPTION 'Anonymous RPC allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$check$;
RESET ROLE;
SET ROLE authenticated;
DO $check$
BEGIN
  BEGIN PERFORM 1 FROM public.members; RAISE EXCEPTION 'Authenticated read allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN TRUNCATE public.members; RAISE EXCEPTION 'Authenticated truncate allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.consume_login_attempt(repeat('a',64), repeat('b',64)); RAISE EXCEPTION 'Authenticated RPC allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$check$;
RESET ROLE;

-- Legitimate backend operations still work with RLS enabled.
SET ROLE service_role;
INSERT INTO public.members (auth_email, first_name, last_name) VALUES ('database-test@example.invalid', 'Test', 'Member');
UPDATE public.members SET city = 'Test City' WHERE auth_email = 'database-test@example.invalid';
DO $check$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.members WHERE city = 'Test City') THEN
    RAISE EXCEPTION 'Backend profile CRUD failed';
  END IF;
  IF NOT public.consume_login_attempt(repeat('a',64), repeat('b',64)) THEN
    RAISE EXCEPTION 'Backend rate limiter failed';
  END IF;
END;
$check$;
DELETE FROM public.members WHERE auth_email = 'database-test@example.invalid';
RESET ROLE;
DROP TABLE public.future_private_table;
DROP FUNCTION public.future_private_rpc();
