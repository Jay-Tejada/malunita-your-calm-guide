-- Add snooze tracking to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_snooze_until timestamp with time zone;

COMMENT ON COLUMN public.profiles.notification_snooze_until IS 'Timestamp until which notifications should be snoozed';