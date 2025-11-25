-- Create memory_events table for tracking user events
CREATE TABLE public.memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memory_events ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_memory_events_user_id ON public.memory_events(user_id);
CREATE INDEX idx_memory_events_created_at ON public.memory_events(created_at DESC);
CREATE INDEX idx_memory_events_event_type ON public.memory_events(event_type);

-- RLS policies for memory_events
CREATE POLICY "Users can insert their own memory events"
ON public.memory_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own memory events"
ON public.memory_events
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage all events
CREATE POLICY "Service role can manage all memory events"
ON public.memory_events
FOR ALL
USING (is_service_role());

-- Create pattern_insights table for AI-generated insights
CREATE TABLE public.pattern_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  insight JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pattern_insights ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_pattern_insights_user_id ON public.pattern_insights(user_id);
CREATE INDEX idx_pattern_insights_created_at ON public.pattern_insights(created_at DESC);
CREATE INDEX idx_pattern_insights_insight_type ON public.pattern_insights(insight_type);

-- RLS policies for pattern_insights
CREATE POLICY "Users can view their own pattern insights"
ON public.pattern_insights
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage all insights (AI systems will insert these)
CREATE POLICY "Service role can manage all pattern insights"
ON public.pattern_insights
FOR ALL
USING (is_service_role());

-- Create user_preferences table for learned user preferences
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can manage all preferences
CREATE POLICY "Service role can manage all user preferences"
ON public.user_preferences
FOR ALL
USING (is_service_role());

-- Create trigger to auto-update updated_at for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();