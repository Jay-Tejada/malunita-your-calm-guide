-- Add bonding score and tier to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bonding_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonding_tier text DEFAULT 'acquaintance',
ADD COLUMN IF NOT EXISTS last_interaction_at timestamp with time zone DEFAULT now();