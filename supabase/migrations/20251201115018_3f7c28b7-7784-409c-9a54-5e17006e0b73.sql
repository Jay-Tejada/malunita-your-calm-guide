-- Create thoughts table for notes that aren't tasks
CREATE TABLE IF NOT EXISTS public.thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint (auth.users is managed by Supabase, only reference primary key)
-- Note: We don't add ON DELETE CASCADE to auth.users as it's managed by Supabase

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON public.thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON public.thoughts(created_at DESC);

-- Enable RLS
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own thoughts" 
  ON public.thoughts
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own thoughts" 
  ON public.thoughts
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thoughts" 
  ON public.thoughts
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own thoughts" 
  ON public.thoughts
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_thoughts_updated_at
  BEFORE UPDATE ON public.thoughts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();