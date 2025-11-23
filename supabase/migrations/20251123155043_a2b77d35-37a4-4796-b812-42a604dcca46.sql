-- Create malunita_backups table for storing companion data backups
CREATE TABLE public.malunita_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  backup_data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_auto_save BOOLEAN NOT NULL DEFAULT true,
  backup_name TEXT
);

-- Enable RLS
ALTER TABLE public.malunita_backups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own backups"
ON public.malunita_backups
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backups"
ON public.malunita_backups
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
ON public.malunita_backups
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_malunita_backups_user_created 
ON public.malunita_backups(user_id, created_at DESC);

-- Limit to 10 most recent backups per user (cleanup function)
CREATE OR REPLACE FUNCTION public.cleanup_old_backups()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.malunita_backups
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM public.malunita_backups
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-cleanup old backups
CREATE TRIGGER trigger_cleanup_old_backups
AFTER INSERT ON public.malunita_backups
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_backups();