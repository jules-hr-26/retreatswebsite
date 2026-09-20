CREATE TABLE public.login_rate_limits (
  key_hash text PRIMARY KEY CHECK (length(key_hash) = 64),
  attempts integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX login_rate_limits_expiry ON public.login_rate_limits(expires_at);
ALTER TABLE public.login_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.login_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.login_rate_limits TO service_role;

-- Row locking in ON CONFLICT makes limits shared and atomic across server instances.
CREATE FUNCTION public.consume_login_attempt(email_key text, source_key text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  email_count integer;
  source_count integer;
BEGIN
  DELETE FROM public.login_rate_limits WHERE expires_at < now();
  INSERT INTO public.login_rate_limits AS limits (key_hash, attempts, expires_at)
    VALUES (email_key, 1, now() + interval '1 hour')
    ON CONFLICT (key_hash) DO UPDATE SET attempts = least(limits.attempts + 1, 1000000)
    RETURNING attempts INTO email_count;
  INSERT INTO public.login_rate_limits AS limits (key_hash, attempts, expires_at)
    VALUES (source_key, 1, now() + interval '1 hour')
    ON CONFLICT (key_hash) DO UPDATE SET attempts = least(limits.attempts + 1, 1000000)
    RETURNING attempts INTO source_count;
  RETURN email_count <= 5 AND source_count <= 20;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_login_attempt(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_login_attempt(text, text) TO service_role;
