ALTER TABLE public.event_attendees ADD COLUMN IF NOT EXISTS notify boolean NOT NULL DEFAULT true;
