-- Add companion identity fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN companion_name text,
ADD COLUMN companion_personality_type text DEFAULT 'zen',
ADD COLUMN companion_colorway text DEFAULT 'zen-default',
ADD COLUMN companion_stage integer DEFAULT 1,
ADD COLUMN companion_xp integer DEFAULT 0;

-- Add check constraint for personality types
ALTER TABLE public.profiles
ADD CONSTRAINT check_personality_type 
CHECK (companion_personality_type IN ('zen', 'spark', 'cosmo'));

COMMENT ON COLUMN public.profiles.companion_name IS 'User-chosen name for their companion';
COMMENT ON COLUMN public.profiles.companion_personality_type IS 'Personality type: zen (calm), spark (energetic), cosmo (mystical)';
COMMENT ON COLUMN public.profiles.companion_colorway IS 'Visual theme tied to personality';
COMMENT ON COLUMN public.profiles.companion_stage IS 'Companion growth stage (future feature)';
COMMENT ON COLUMN public.profiles.companion_xp IS 'Experience points for companion (future feature)';