-- Add future_priority_score column to tasks table
ALTER TABLE public.tasks
ADD COLUMN future_priority_score numeric DEFAULT 0;

-- Add index for better query performance
CREATE INDEX idx_tasks_future_priority_score ON public.tasks(future_priority_score DESC) WHERE completed = false;

-- Add comment explaining the column
COMMENT ON COLUMN public.tasks.future_priority_score IS 'AI-predicted likelihood (0-1) that this task will become a future ONE-thing, based on semantic similarity to past focus tasks';