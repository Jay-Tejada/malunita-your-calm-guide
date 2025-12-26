-- Create table for individual learning signals
CREATE TABLE public.user_learning_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  signal_type TEXT NOT NULL,
  signal_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_learning_signals_user_created ON public.user_learning_signals(user_id, created_at DESC);
CREATE INDEX idx_learning_signals_type ON public.user_learning_signals(user_id, signal_type);

-- Enable RLS
ALTER TABLE public.user_learning_signals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert their own learning signals"
ON public.user_learning_signals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own learning signals"
ON public.user_learning_signals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all learning signals"
ON public.user_learning_signals FOR ALL
USING (is_service_role());

-- Create table for aggregated user learning preferences
CREATE TABLE public.user_learning_preferences (
  user_id UUID NOT NULL PRIMARY KEY,
  preferred_destinations JSONB NOT NULL DEFAULT '{}'::jsonb,
  task_granularity TEXT NOT NULL DEFAULT 'balanced',
  decomposition_threshold NUMERIC NOT NULL DEFAULT 0.7,
  confidence_bias NUMERIC NOT NULL DEFAULT 0.0,
  edit_frequency NUMERIC NOT NULL DEFAULT 0.0,
  signals_processed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_learning_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own preferences"
ON public.user_learning_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_learning_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_learning_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all preferences"
ON public.user_learning_preferences FOR ALL
USING (is_service_role());

-- Add trigger for updated_at
CREATE TRIGGER update_user_learning_preferences_updated_at
BEFORE UPDATE ON public.user_learning_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();