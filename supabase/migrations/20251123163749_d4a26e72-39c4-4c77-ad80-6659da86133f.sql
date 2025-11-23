-- Add support for personality archetype system
-- Note: We're using emotional_memory JSONB to store archetype_affinity
-- and companion_personality_type for the selected archetype

-- Update companion_personality_type to support new archetypes
COMMENT ON COLUMN public.profiles.companion_personality_type IS 'Personality archetype: zen-guide, hype-friend, soft-mentor, or cozy-companion';

-- Update emotional_memory comment to reflect new usage
COMMENT ON COLUMN public.profiles.emotional_memory IS 'Stores emotional state AND archetype_affinity data as JSONB';
