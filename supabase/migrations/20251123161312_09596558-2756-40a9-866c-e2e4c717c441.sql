-- Enable realtime for weekly_quests table
ALTER TABLE public.weekly_quests REPLICA IDENTITY FULL;

-- The table is already in supabase_realtime publication by default
-- But we'll ensure it explicitly if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'weekly_quests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_quests;
  END IF;
END $$;