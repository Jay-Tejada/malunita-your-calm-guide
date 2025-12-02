-- Create flow_sessions table
CREATE TABLE public.flow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'scheduled',
  session_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  task_ids UUID[] NOT NULL DEFAULT '{}',
  reflection TEXT,
  tasks_completed INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.flow_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own flow sessions"
ON public.flow_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flow sessions"
ON public.flow_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flow sessions"
ON public.flow_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flow sessions"
ON public.flow_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX idx_flow_sessions_user_date ON public.flow_sessions(user_id, created_at DESC);