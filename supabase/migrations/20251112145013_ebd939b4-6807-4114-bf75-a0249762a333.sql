-- Add personalization fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS insights jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS preferences_summary text,
ADD COLUMN IF NOT EXISTS last_personalization_run timestamp with time zone;