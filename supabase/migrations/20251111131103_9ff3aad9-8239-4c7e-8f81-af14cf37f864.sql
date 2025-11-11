-- Add goal tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN current_goal TEXT,
ADD COLUMN goal_timeframe TEXT DEFAULT 'this_week',
ADD COLUMN goal_updated_at TIMESTAMP WITH TIME ZONE;

-- Add goal alignment to tasks
ALTER TABLE public.tasks
ADD COLUMN goal_aligned BOOLEAN DEFAULT NULL,
ADD COLUMN alignment_reason TEXT;

-- Create index for goal-aligned tasks
CREATE INDEX idx_tasks_goal_aligned ON public.tasks(goal_aligned) WHERE goal_aligned = true;