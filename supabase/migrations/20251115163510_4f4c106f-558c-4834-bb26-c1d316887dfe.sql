-- Add last_sent_at column to track when notifications were sent
ALTER TABLE public.smart_notifications
ADD COLUMN last_sent_at timestamp with time zone;