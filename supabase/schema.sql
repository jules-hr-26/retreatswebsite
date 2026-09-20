-- ================================================================
-- CNLC Platform — Supabase Schema
-- Fresh installations only: run this baseline, then migrations in filename order.
-- Existing production databases: apply only migrations not already recorded.
-- ================================================================

-- Keep fresh-install tables private throughout setup, including on projects
-- whose default privileges grant access to API roles.
BEGIN;

-- ── Alumni allowlist ───────────────────────────────────────────
-- Controls who can register. Mirrors "Alumni Email Allowlist" sheet.
CREATE TABLE alumni_allowlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name  text NOT NULL,
  email      text NOT NULL UNIQUE,
  cohort     text,
  added_at   timestamptz NOT NULL DEFAULT now(),
  added_by   text
);

-- ── Member profiles ────────────────────────────────────────────
-- Mirrors "Profiles" sheet (columns A–O).
CREATE TABLE members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_email      text NOT NULL UNIQUE,
  display_email   text,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  city            text,
  country         text,
  organisation    text,
  sector          text,
  cohort          text,
  role_title      text,
  phone           text,
  in_directory    boolean NOT NULL DEFAULT false,
  headshot_data   text,
  gdpr_consent_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Community / climate events ─────────────────────────────────
-- Mirrors "Events" sheet. name is used as the join key with attendees.
CREATE TABLE events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL UNIQUE,
  start_date      text,
  end_date        text,
  city            text,
  description     text,
  discussion_link text,
  status          text NOT NULL DEFAULT 'approved',
  proposed_by     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Event attendees ────────────────────────────────────────────
-- Mirrors "Event Attendees" sheet.
CREATE TABLE event_attendees (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name   text NOT NULL,
  member_email text NOT NULL,
  status       text NOT NULL DEFAULT 'yes',
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_name, member_email)
);

-- ── Proposed community events ─────────────────────────────────
CREATE TABLE proposed_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  format      text,
  date        text NOT NULL,
  duration    text,
  location    text,
  link        text,
  description text NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Community offerings ───────────────────────────────────────
CREATE TABLE offerings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  retreat     text,
  category    text,
  fee_type    text,
  fee_info    text,
  location    text,
  format      text,
  title       text NOT NULL,
  description text NOT NULL,
  website     text,
  linkedin    text,
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Forum posts ────────────────────────────────────────────────
-- Mirrors "Forum Posts" sheet (columns A–G).
CREATE TABLE forum_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      text NOT NULL UNIQUE,
  forum_name   text NOT NULL,
  author_email text NOT NULL,
  author_name  text NOT NULL,
  title        text NOT NULL,
  body         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Forum replies ──────────────────────────────────────────────
-- Mirrors "Forum Replies" sheet (columns A–G).
CREATE TABLE forum_replies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id     text NOT NULL UNIQUE,
  post_id      text NOT NULL,
  forum_name   text NOT NULL,
  author_email text NOT NULL,
  author_name  text NOT NULL,
  body         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Forum memberships ──────────────────────────────────────────
-- Mirrors "Forum Members" sheet (columns A–D).
-- notify: 'yes' = active + notified, 'no' = active + silent, 'left' = left
CREATE TABLE forum_memberships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_name   text NOT NULL,
  member_email text NOT NULL,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  notify       text NOT NULL DEFAULT 'yes',
  UNIQUE (forum_name, member_email)
);

-- ── Admin accounts ─────────────────────────────────────────────
-- Admin access uses the same revocable member session plus a server-side role check.
CREATE TABLE admins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  name       text NOT NULL,
  role       text NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

-- ── Audit log ──────────────────────────────────────────────────
CREATE TABLE audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action      text NOT NULL,
  table_name  text,
  record_id   text,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Site settings ──────────────────────────────────────────────
CREATE TABLE site_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

-- ================================================================
-- Row Level Security
-- Vercel functions use SUPABASE_SERVICE_KEY which bypasses RLS.
-- The anon/publishable key has zero table access — all reads and
-- writes go through the Vercel API layer, never direct from browser.
-- ================================================================

-- No public policies: API roles get no rows even if a table grant is restored.
-- Service-role requests still require authorization in the Vercel API layer.

ALTER TABLE public.alumni_allowlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.alumni_allowlist FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alumni_allowlist TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.members FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO service_role;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_attendees FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendees TO service_role;
ALTER TABLE public.proposed_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.proposed_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposed_events TO service_role;
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.offerings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offerings TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.forum_posts FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_posts TO service_role;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.forum_replies FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_replies TO service_role;
ALTER TABLE public.forum_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.forum_memberships FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_memberships TO service_role;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admins FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_log TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO service_role;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
COMMIT;
