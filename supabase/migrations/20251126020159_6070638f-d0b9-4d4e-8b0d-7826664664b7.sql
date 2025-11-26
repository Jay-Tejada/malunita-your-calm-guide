-- Create task_history table
CREATE TABLE public.task_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_text TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT,
  sentiment TEXT,
  difficulty TEXT,
  emotional_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own task history"
  ON public.task_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task history"
  ON public.task_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_task_history_user_completed ON public.task_history(user_id, completed_at DESC);
CREATE INDEX idx_task_history_category ON public.task_history(user_id, category);