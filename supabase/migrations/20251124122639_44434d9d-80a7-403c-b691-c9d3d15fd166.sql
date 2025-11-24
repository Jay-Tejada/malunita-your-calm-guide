-- Add focus_preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN focus_preferences jsonb DEFAULT '{}'::jsonb;