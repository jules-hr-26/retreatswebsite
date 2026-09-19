CREATE TABLE public.login_tokens (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.app_sessions (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX app_sessions_email_idx ON public.app_sessions(email);
CREATE INDEX login_tokens_email_idx ON public.login_tokens(email);
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_sessions, public.login_tokens FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_sessions, public.login_tokens TO service_role;
