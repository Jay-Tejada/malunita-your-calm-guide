-- Add seasonal_visuals toggle to ritual_preferences in profiles table
-- This allows users to enable/disable seasonal visual effects (default: true)

-- Note: ritual_preferences is already a JSONB column, so we just need to document
-- that it can contain a 'seasonal_visuals' boolean field
-- Example structure: {"seasonal_visuals": true, "morning_ritual": {...}, ...}

-- No migration needed as the column already exists and JSONB can hold any structure
-- This is just a comment to document the new field usage