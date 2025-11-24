-- Add primary focus alignment field to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS primary_focus_alignment text 
CHECK (primary_focus_alignment IN ('aligned', 'neutral', 'distracting'));

COMMENT ON COLUMN public.tasks.primary_focus_alignment IS 
'Semantic alignment with today''s ONE-thing task: aligned (supports), neutral (unrelated), distracting (conflicts)';