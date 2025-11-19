-- Add cosmetic unlock tracking to profiles
ALTER TABLE profiles 
ADD COLUMN unlocked_colorways TEXT[] DEFAULT ARRAY['zen-default']::TEXT[],
ADD COLUMN unlocked_auras TEXT[] DEFAULT ARRAY['calm-bloom']::TEXT[],
ADD COLUMN unlocked_trails TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN selected_colorway TEXT DEFAULT 'zen-default',
ADD COLUMN selected_aura TEXT DEFAULT 'calm-bloom',
ADD COLUMN selected_trail TEXT DEFAULT NULL,
ADD COLUMN task_completion_streak INTEGER DEFAULT 0,
ADD COLUMN reflection_streak INTEGER DEFAULT 0,
ADD COLUMN voice_session_count INTEGER DEFAULT 0,
ADD COLUMN fiesta_completion_count INTEGER DEFAULT 0;