-- Create focus_streaks table to track user's focus completion streaks
CREATE TABLE IF NOT EXISTS public.focus_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_updated_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.focus_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own streak"
  ON public.focus_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak"
  ON public.focus_streaks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
  ON public.focus_streaks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_focus_streaks_user_id ON public.focus_streaks(user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_focus_streaks_updated_at
  BEFORE UPDATE ON public.focus_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();