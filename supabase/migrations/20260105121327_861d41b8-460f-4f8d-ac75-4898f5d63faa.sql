-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own voice notes
CREATE POLICY "Users can upload their own voice notes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to read their own voice notes
CREATE POLICY "Users can read their own voice notes"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own voice notes
CREATE POLICY "Users can delete their own voice notes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add pending_audio_path column to tasks for voice notes awaiting processing
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS pending_audio_path TEXT;

-- Add processing_status column to track voice note processing state
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT NULL;

COMMENT ON COLUMN public.tasks.pending_audio_path IS 'Storage path for voice note audio awaiting transcription';
COMMENT ON COLUMN public.tasks.processing_status IS 'Status of async processing: pending, processing, completed, failed';