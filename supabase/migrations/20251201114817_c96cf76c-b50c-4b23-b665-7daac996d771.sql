-- Add rituals_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rituals_enabled boolean DEFAULT true;