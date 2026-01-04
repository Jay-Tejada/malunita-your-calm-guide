-- Create table for weekly priorities
CREATE TABLE public.weekly_priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  priority_one TEXT,
  priority_two TEXT,
  priority_three TEXT,
  calendar_blocks_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable Row Level Security
ALTER TABLE public.weekly_priorities ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own weekly priorities" 
ON public.weekly_priorities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weekly priorities" 
ON public.weekly_priorities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly priorities" 
ON public.weekly_priorities 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_weekly_priorities_updated_at
BEFORE UPDATE ON public.weekly_priorities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();