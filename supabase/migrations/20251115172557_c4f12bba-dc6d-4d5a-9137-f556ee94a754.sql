-- Create table for storing category keyword mappings
CREATE TABLE public.category_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  custom_category_id UUID NOT NULL REFERENCES public.custom_categories(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, custom_category_id, keyword)
);

-- Enable Row Level Security
ALTER TABLE public.category_keywords ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own keywords" 
ON public.category_keywords 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own keywords" 
ON public.category_keywords 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords" 
ON public.category_keywords 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_category_keywords_user_id ON public.category_keywords(user_id);
CREATE INDEX idx_category_keywords_category_id ON public.category_keywords(custom_category_id);