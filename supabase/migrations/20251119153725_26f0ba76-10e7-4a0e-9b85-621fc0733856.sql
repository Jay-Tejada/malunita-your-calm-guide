-- Add lore tracking to profiles
ALTER TABLE profiles 
ADD COLUMN last_lore_shown_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN lore_moments_seen INTEGER DEFAULT 0;