-- Add emotional memory tracking to profiles
ALTER TABLE profiles
ADD COLUMN emotional_memory jsonb DEFAULT '{
  "joy": 50,
  "stress": 50,
  "affection": 50,
  "fatigue": 50
}'::jsonb;