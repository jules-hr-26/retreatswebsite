-- ================================================================
-- CNLC Platform — Supabase Schema
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ================================================================

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

-- ── Proposed community events (email → Julia) ─────────────────
-- Currently only sent by email, never stored. Now persisted.
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

-- ── Community offerings (email → Julia) ───────────────────────
-- Currently only sent by email, never stored. Now persisted.
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
-- Separate from member auth. Admin panel uses Supabase Auth password login.
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

ALTER TABLE alumni_allowlist  ENABLE ROW LEVEL SECURITY;
ALTER TABLE members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees   ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposed_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings     ENABLE ROW LEVEL SECURITY;

-- No public policies = anon key sees nothing.
-- Service role key bypasses RLS entirely (used only in Vercel server functions).
