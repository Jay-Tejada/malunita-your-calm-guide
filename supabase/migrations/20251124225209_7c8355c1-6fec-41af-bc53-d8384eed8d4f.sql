-- Create table for daily one thing answers
CREATE TABLE IF NOT EXISTS public.daily_one_thing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.daily_one_thing ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own one thing answers"
  ON public.daily_one_thing
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own one thing answers"
  ON public.daily_one_thing
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own one thing answers"
  ON public.daily_one_thing
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_daily_one_thing_user_date ON public.daily_one_thing(user_id, date DESC);

-- Ensure one answer per user per day
CREATE UNIQUE INDEX idx_daily_one_thing_unique ON public.daily_one_thing(user_id, date);