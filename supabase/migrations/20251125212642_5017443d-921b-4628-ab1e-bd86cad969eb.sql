-- Create capture_sessions table for tracking voice capture history
CREATE TABLE public.capture_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  raw_text TEXT NOT NULL,
  summary TEXT,
  task_ids UUID[] NOT NULL DEFAULT '{}',
  intent_tags TEXT[] NOT NULL DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.capture_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own capture sessions"
ON public.capture_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own capture sessions"
ON public.capture_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capture sessions"
ON public.capture_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own capture sessions"
ON public.capture_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_capture_sessions_user_created 
ON public.capture_sessions(user_id, created_at DESC);