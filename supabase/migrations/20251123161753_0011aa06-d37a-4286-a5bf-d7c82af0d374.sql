-- Add selected_ambient_world column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS selected_ambient_world TEXT DEFAULT 'cozy-room';

-- Add a comment to document valid values
COMMENT ON COLUMN profiles.selected_ambient_world IS 'Selected ambient world environment. Valid values: cozy-room, forest-clearing, crystal-nebula, pastel-meadow, minimalist-studio';