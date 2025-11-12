-- Create learning_trends table to store global analysis results
CREATE TABLE public.learning_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  top_misunderstood_phrasings JSONB NOT NULL DEFAULT '[]'::jsonb,
  common_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  categorization_improvements TEXT,
  suggestion_improvements TEXT,
  total_corrections_analyzed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_trends ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (from edge function)
CREATE POLICY "Service role can insert trends"
ON public.learning_trends
FOR INSERT
WITH CHECK (is_service_role());

-- Admins can view all trends
CREATE POLICY "Admins can view trends"
ON public.learning_trends
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_learning_trends_date ON public.learning_trends(analysis_date DESC);