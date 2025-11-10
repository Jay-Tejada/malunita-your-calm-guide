-- Add mood column to conversation_history table
ALTER TABLE public.conversation_history 
ADD COLUMN mood text;

-- Add a check constraint for valid mood values
ALTER TABLE public.conversation_history 
ADD CONSTRAINT valid_mood 
CHECK (mood IS NULL OR mood IN ('focused', 'calm', 'overwhelmed', 'energized', 'distracted'));