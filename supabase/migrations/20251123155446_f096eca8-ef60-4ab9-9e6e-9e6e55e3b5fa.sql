-- Add new fields to profiles table for customization
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS selected_accessory TEXT,
ADD COLUMN IF NOT EXISTS unlocked_accessories TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS unlocked_expressions TEXT[] DEFAULT ARRAY['basic-pack']::TEXT[];