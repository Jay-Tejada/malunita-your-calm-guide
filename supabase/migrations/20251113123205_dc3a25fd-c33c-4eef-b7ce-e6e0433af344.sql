-- Add reminder_time column to tasks table
ALTER TABLE public.tasks ADD COLUMN reminder_time TIMESTAMP WITH TIME ZONE;

-- Create index for efficient reminder queries
CREATE INDEX idx_tasks_reminder_time ON public.tasks(reminder_time) WHERE reminder_time IS NOT NULL AND completed = false;

-- Create task_reminders table to track sent reminders
CREATE TABLE public.task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, reminder_time)
);

-- Enable RLS on task_reminders
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_reminders
CREATE POLICY "Users can view their own reminders"
ON public.task_reminders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert reminders"
ON public.task_reminders
FOR INSERT
WITH CHECK (is_service_role());