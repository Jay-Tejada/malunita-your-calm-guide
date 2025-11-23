-- Create table for habit logs
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  task_category text NOT NULL,
  task_title text NOT NULL,
  time_of_day text NOT NULL, -- 'morning', 'afternoon', 'evening', 'night'
  day_of_week integer NOT NULL, -- 0-6 (Sunday-Saturday)
  task_duration_minutes integer,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own habit logs"
ON public.habit_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit logs"
ON public.habit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage habit logs"
ON public.habit_logs
FOR ALL
USING (is_service_role());

-- Add index for faster queries
CREATE INDEX idx_habit_logs_user_time ON public.habit_logs(user_id, completed_at DESC);
CREATE INDEX idx_habit_logs_category ON public.habit_logs(user_id, task_category, time_of_day);

-- Function to cleanup old habit logs (keep only 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_habit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.habit_logs
  WHERE completed_at < now() - interval '30 days';
END;
$$;