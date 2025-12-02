-- Create bucket for journal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-photos', 'journal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload journal photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'journal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own photos
CREATE POLICY "Users can view own journal photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'journal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own journal photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'journal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add photos column to journal_entries
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';