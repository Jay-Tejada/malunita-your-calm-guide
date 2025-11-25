-- Add learning_profile to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS learning_profile jsonb DEFAULT '{
  "category_confidence": {},
  "priority_confidence": {},
  "project_inference": {},
  "clarification_patterns": {},
  "last_retrain": null,
  "correction_count_since_retrain": 0
}'::jsonb;