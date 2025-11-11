-- Create table to track task suggestion corrections for learning
CREATE TABLE public.task_learning_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_text TEXT NOT NULL,
  task_title TEXT NOT NULL,
  suggested_category TEXT NOT NULL,
  actual_category TEXT NOT NULL,
  suggested_timeframe TEXT NOT NULL,
  actual_timeframe TEXT NOT NULL,
  was_corrected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_learning_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own feedback"
ON public.task_learning_feedback
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback"
ON public.task_learning_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_task_learning_feedback_user_id ON public.task_learning_feedback(user_id);
CREATE INDEX idx_task_learning_feedback_created_at ON public.task_learning_feedback(created_at DESC);