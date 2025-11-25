-- Add hidden_intent column to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS hidden_intent TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.tasks.hidden_intent IS 'AI-discovered underlying goal or theme behind the task, extracted from deep reasoning analysis';
