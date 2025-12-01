-- Create user_patterns table for tracking user behavior
CREATE TABLE IF NOT EXISTS public.user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'peak_hours', 'common_categories', 'completion_rate', etc.
  pattern_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pattern_type)
);

-- Enable RLS
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own patterns"
  ON public.user_patterns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patterns"
  ON public.user_patterns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns"
  ON public.user_patterns
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update or insert pattern
CREATE OR REPLACE FUNCTION public.update_user_pattern(
  p_user_id UUID,
  p_pattern_type TEXT,
  p_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_patterns (user_id, pattern_type, pattern_data, updated_at)
  VALUES (p_user_id, p_pattern_type, p_data, NOW())
  ON CONFLICT (user_id, pattern_type)
  DO UPDATE SET
    pattern_data = 
      CASE
        -- For completion_hours, accumulate counts
        WHEN p_pattern_type = 'completion_hours' THEN
          jsonb_set(
            COALESCE(public.user_patterns.pattern_data, '{}'::jsonb),
            ARRAY['hours', (p_data->>'hour')::text],
            to_jsonb(COALESCE((public.user_patterns.pattern_data->'hours'->(p_data->>'hour'))::int, 0) + 1)
          )
        -- For other patterns, merge data
        ELSE public.user_patterns.pattern_data || p_data
      END,
    updated_at = NOW();
END;
$$;

-- Create trigger to update timestamp
CREATE TRIGGER update_user_patterns_timestamp
  BEFORE UPDATE ON public.user_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_patterns_user_type 
  ON public.user_patterns(user_id, pattern_type);