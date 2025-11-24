-- Create daily_focus_history table to track focus task reflections
CREATE TABLE IF NOT EXISTS public.daily_focus_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  focus_task TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('done', 'partial', 'missed')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_focus_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own focus history"
  ON public.daily_focus_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus history"
  ON public.daily_focus_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus history"
  ON public.daily_focus_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_daily_focus_history_user_date ON public.daily_focus_history(user_id, date DESC);