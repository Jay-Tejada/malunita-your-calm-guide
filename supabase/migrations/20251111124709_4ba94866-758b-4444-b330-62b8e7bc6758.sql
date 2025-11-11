-- Add preferred GPT model to profiles
ALTER TABLE public.profiles 
ADD COLUMN preferred_gpt_model TEXT DEFAULT 'gpt-4-turbo' CHECK (preferred_gpt_model IN ('gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'));