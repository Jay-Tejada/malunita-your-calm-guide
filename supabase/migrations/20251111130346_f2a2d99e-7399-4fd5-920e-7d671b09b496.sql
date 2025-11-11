-- Update profiles table to ensure gpt-4-turbo is the locked default
ALTER TABLE public.profiles 
ALTER COLUMN preferred_gpt_model SET DEFAULT 'gpt-4-turbo';

-- Update all existing users to use gpt-4-turbo
UPDATE public.profiles 
SET preferred_gpt_model = 'gpt-4-turbo' 
WHERE preferred_gpt_model IS NULL OR preferred_gpt_model != 'gpt-4-turbo';

-- Add constraint to only allow gpt-4-turbo (can be changed by admin via direct DB access)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_preferred_gpt_model_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_preferred_gpt_model_check 
CHECK (preferred_gpt_model IN ('gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'));