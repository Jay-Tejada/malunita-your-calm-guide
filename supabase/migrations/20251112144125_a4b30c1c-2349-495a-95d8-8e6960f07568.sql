-- Add custom_stop_commands column to profiles table
ALTER TABLE profiles 
ADD COLUMN custom_stop_commands text[] DEFAULT ARRAY[]::text[];