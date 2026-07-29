-- CNLC Platform — Supabase schema
-- Run this in the Supabase SQL editor (app.supabase.com → SQL Editor → New query)
-- All statements use IF NOT EXISTS so it's safe to re-run.

-- ── Admins ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email     text UNIQUE NOT NULL,
  name      text,
  role      text NOT NULL DEFAULT 'admin', -- 'super_admin' | 'admin'
  created_at timestamptz DEFAULT now(),
  created_by text
);

-- ── Alumni allowlist (who can log in) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS alumni_allowlist (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text UNIQUE NOT NULL,
  first_name text,
  last_name  text,
  cohort     text,
  added_at   timestamptz DEFAULT now(),
  added_by   text
);

-- ── Member profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_email     text UNIQUE NOT NULL,
  display_email  text,
  first_name     text,
  last_name      text,
  city           text,
  country        text,
  organisation   text,
  sector         text,
  cohort         text,  -- comma-separated cohort slugs
  role_title     text,
  phone          text,
  in_directory   boolean DEFAULT false,
  headshot_data  text,  -- base64 JPEG
  gdpr_consent_at timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ── Climate events ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL,
  start_date      date,
  end_date        date,
  city            text,
  description     text,
  discussion_link text,
  status          text DEFAULT 'approved', -- 'approved' | 'pending' | 'rejected'
  proposed_by     text,
  created_at      timestamptz DEFAULT now()
);

-- ── Event attendees ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_attendees (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name   text NOT NULL,
  member_email text NOT NULL,
  status       text DEFAULT 'yes', -- 'yes' | 'no'
  created_at   timestamptz DEFAULT now(),
  UNIQUE (event_name, member_email)
);

-- ── Proposed community events (from platform form) ───────────────────────────
CREATE TABLE IF NOT EXISTS proposed_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  format      text,        -- 'Online' | 'In person' | 'Hybrid'
  date        text,        -- YYYY-MM-DD or free text
  duration    text,
  location    text,
  link        text,
  description text,
  status      text DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  proposed_by text,
  created_at  timestamptz DEFAULT now()
);

-- ── Member offerings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offerings (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  email       text NOT NULL,
  retreat     text,
  category    text,
  fee_type    text,        -- 'Free' | 'Has a fee'
  fee_info    text,
  location    text,
  format      text,
  title       text NOT NULL,
  description text NOT NULL,
  website     text,
  linkedin    text,
  status      text DEFAULT 'pending', -- 'pending' | 'published' | 'rejected'
  created_at  timestamptz DEFAULT now()
);

-- ── Forum memberships ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_memberships (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_name   text NOT NULL,
  member_email text NOT NULL,
  notify       text DEFAULT 'yes', -- 'yes' | 'no' | 'left'
  created_at   timestamptz DEFAULT now(),
  UNIQUE (forum_name, member_email)
);

-- ── Forum posts ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id      text UNIQUE NOT NULL, -- timestamp string set by client
  forum_name   text NOT NULL,
  author_email text NOT NULL,
  author_name  text,
  title        text NOT NULL,
  body         text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- ── Forum replies ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_replies (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id     text UNIQUE NOT NULL, -- timestamp string set by client
  post_id      text NOT NULL,        -- references forum_posts.post_id
  forum_name   text NOT NULL,
  author_email text NOT NULL,
  author_name  text,
  body         text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- ── Seed: Julia as super_admin ───────────────────────────────────────────────
-- Change the email if needed. Skip if already present.
INSERT INTO admins (email, name, role)
VALUES ('julia@globaloptimism.com', 'Julia', 'super_admin')
ON CONFLICT (email) DO NOTHING;
