-- Create table for AI reasoning logs
CREATE TABLE IF NOT EXISTS public.ai_reasoning_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transcript TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('fast', 'deep')),
  answer TEXT,
  steps JSONB,
  reasoning_metadata JSONB,
  time_taken_ms INTEGER,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_reasoning_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view their own reasoning logs"
  ON public.ai_reasoning_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert their own reasoning logs"
  ON public.ai_reasoning_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reasoning_log_user_created 
  ON public.ai_reasoning_log(user_id, created_at DESC);
