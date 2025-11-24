-- Create priority_storms table for predictive load analysis
CREATE TABLE IF NOT EXISTS public.priority_storms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  expected_load_score INTEGER NOT NULL CHECK (expected_load_score >= 0 AND expected_load_score <= 100),
  recommended_focus_task TEXT,
  task_count INTEGER DEFAULT 0,
  deadline_count INTEGER DEFAULT 0,
  recurrence_count INTEGER DEFAULT 0,
  cluster_density JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.priority_storms ENABLE ROW LEVEL SECURITY;

-- Users can view their own predictions
CREATE POLICY "Users can view their own storm predictions"
  ON public.priority_storms
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own predictions
CREATE POLICY "Users can insert their own storm predictions"
  ON public.priority_storms
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own predictions
CREATE POLICY "Users can update their own storm predictions"
  ON public.priority_storms
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own predictions
CREATE POLICY "Users can delete their own storm predictions"
  ON public.priority_storms
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for efficient date-based queries
CREATE INDEX idx_priority_storms_user_date ON public.priority_storms(user_id, date);
CREATE INDEX idx_priority_storms_date ON public.priority_storms(date);