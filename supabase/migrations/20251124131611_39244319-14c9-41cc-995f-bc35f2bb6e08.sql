-- Add focus_persona field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS focus_persona jsonb DEFAULT '{
  "ambition": 0.5,
  "preference_domains": {},
  "time_of_day_tendency": "morning",
  "emotional_alignment": {},
  "momentum": 0.5,
  "avoidance_profile": {},
  "last_updated": null,
  "analysis_count": 0
}'::jsonb;