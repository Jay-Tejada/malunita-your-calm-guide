-- Create recent event titles table for smart autocomplete
CREATE TABLE IF NOT EXISTS public.recent_event_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, title)
);

-- Enable RLS
ALTER TABLE public.recent_event_titles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own event titles"
  ON public.recent_event_titles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event titles"
  ON public.recent_event_titles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event titles"
  ON public.recent_event_titles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event titles"
  ON public.recent_event_titles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_recent_event_titles_user_usage 
  ON public.recent_event_titles(user_id, usage_count DESC, last_used_at DESC);

CREATE INDEX idx_recent_event_titles_title 
  ON public.recent_event_titles(user_id, title);