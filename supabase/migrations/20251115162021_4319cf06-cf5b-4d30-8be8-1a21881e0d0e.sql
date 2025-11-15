-- Create table for smart notifications based on AI recommendations
CREATE TABLE IF NOT EXISTS public.smart_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_day TEXT, -- e.g., 'Monday', 'Tuesday'
  suggested_time TIME,
  is_active BOOLEAN DEFAULT true,
  dismissed BOOLEAN DEFAULT false,
  created_from_week TEXT, -- Week identifier (e.g., '2025-W03')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT smart_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own smart notifications"
  ON public.smart_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own smart notifications"
  ON public.smart_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own smart notifications"
  ON public.smart_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own smart notifications"
  ON public.smart_notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_smart_notifications_updated_at
  BEFORE UPDATE ON public.smart_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_smart_notifications_user_active 
  ON public.smart_notifications(user_id, is_active, dismissed);
