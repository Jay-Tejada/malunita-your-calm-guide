-- Create inbox_cleanup_log table for tracking cleanup sessions
CREATE TABLE public.inbox_cleanup_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  archived_count INTEGER NOT NULL DEFAULT 0,
  snoozed_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.inbox_cleanup_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cleanup logs"
ON public.inbox_cleanup_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cleanup logs"
ON public.inbox_cleanup_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_inbox_cleanup_log_user_created 
ON public.inbox_cleanup_log(user_id, created_at DESC);