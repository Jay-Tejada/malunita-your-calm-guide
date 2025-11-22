-- Create storage bucket for hatching photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('hatching-moments', 'hatching-moments', true)
ON CONFLICT (id) DO NOTHING;

-- Create table to track hatching moments
CREATE TABLE IF NOT EXISTS public.hatching_moments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stage_reached INTEGER NOT NULL,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  image_path TEXT NOT NULL,
  personality_type TEXT,
  companion_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hatching_moments ENABLE ROW LEVEL SECURITY;

-- Users can view their own hatching moments
CREATE POLICY "Users can view their own hatching moments"
ON public.hatching_moments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own hatching moments
CREATE POLICY "Users can create their own hatching moments"
ON public.hatching_moments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own hatching moments
CREATE POLICY "Users can delete their own hatching moments"
ON public.hatching_moments
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for hatching moments bucket
CREATE POLICY "Users can view hatching moments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hatching-moments');

CREATE POLICY "Users can upload their own hatching moments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hatching-moments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own hatching moments"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'hatching-moments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own hatching moments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'hatching-moments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);