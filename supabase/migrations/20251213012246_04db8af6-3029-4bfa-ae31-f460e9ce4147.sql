-- Create storage bucket for canvas images
INSERT INTO storage.buckets (id, name, public)
VALUES ('canvas-images', 'canvas-images', true);

-- Create policies for canvas images bucket
CREATE POLICY "Users can view canvas images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'canvas-images');

CREATE POLICY "Users can upload their own canvas images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'canvas-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own canvas images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'canvas-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own canvas images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'canvas-images' AND auth.uid()::text = (storage.foldername(name))[1]);