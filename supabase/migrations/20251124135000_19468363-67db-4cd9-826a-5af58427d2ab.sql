-- Create tomorrow_plan table
CREATE TABLE public.tomorrow_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL,
  recommended_one_thing TEXT NOT NULL,
  recommended_one_thing_id UUID,
  supporting_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  tiny_task TEXT,
  tiny_task_id UUID,
  reasoning TEXT,
  storm_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_date)
);

-- Enable RLS
ALTER TABLE public.tomorrow_plan ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own plans"
  ON public.tomorrow_plan
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
  ON public.tomorrow_plan
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON public.tomorrow_plan
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage plans"
  ON public.tomorrow_plan
  FOR ALL
  USING (is_service_role());

-- Create index for faster lookups
CREATE INDEX idx_tomorrow_plan_user_date ON public.tomorrow_plan(user_id, plan_date DESC);