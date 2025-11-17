-- Create tiny_task_fiesta_sessions table
CREATE TABLE public.tiny_task_fiesta_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  tasks_included UUID[] NOT NULL DEFAULT '{}',
  tasks_completed UUID[] NOT NULL DEFAULT '{}',
  completion_rate NUMERIC,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tiny_task_fiesta_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own fiesta sessions"
  ON public.tiny_task_fiesta_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fiesta sessions"
  ON public.tiny_task_fiesta_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fiesta sessions"
  ON public.tiny_task_fiesta_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fiesta sessions"
  ON public.tiny_task_fiesta_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_tiny_task_fiesta_sessions_user_id ON public.tiny_task_fiesta_sessions(user_id);
CREATE INDEX idx_tiny_task_fiesta_sessions_started_at ON public.tiny_task_fiesta_sessions(started_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_tiny_task_fiesta_sessions_updated_at
  BEFORE UPDATE ON public.tiny_task_fiesta_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();