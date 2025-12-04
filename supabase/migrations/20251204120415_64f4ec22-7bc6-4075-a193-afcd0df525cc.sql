-- Add companion/orb state columns to profiles table
-- companion_stage already exists, adding the missing ones

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS companion_traits jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS orb_mood text DEFAULT 'idle';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS orb_energy integer DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS orb_last_evolution timestamp with time zone;