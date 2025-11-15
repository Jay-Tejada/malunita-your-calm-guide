-- Create daily_sessions table
CREATE TABLE public.daily_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  top_focus TEXT,
  priority_two TEXT,
  priority_three TEXT,
  deep_work_blocks JSONB DEFAULT '[]'::jsonb,
  idea_dump_raw TEXT,
  idea_dump_processed JSONB DEFAULT '[]'::jsonb,
  reflection_wins TEXT,
  reflection_improve TEXT,
  reflection_gratitude TEXT,
  tomorrow_focus TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.daily_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.daily_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.daily_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.daily_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_sessions_updated_at
  BEFORE UPDATE ON public.daily_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add optional foreign key to tasks table for linking idea dump tasks
ALTER TABLE public.tasks 
  ADD COLUMN daily_session_id UUID REFERENCES public.daily_sessions(id) ON DELETE SET NULL;