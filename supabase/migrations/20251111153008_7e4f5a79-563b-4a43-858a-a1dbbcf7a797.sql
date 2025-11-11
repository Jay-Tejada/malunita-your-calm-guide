-- Add display_order column to custom_categories table
ALTER TABLE public.custom_categories 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Set initial display_order based on created_at
UPDATE public.custom_categories 
SET display_order = row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_number 
  FROM public.custom_categories
) as numbered 
WHERE custom_categories.id = numbered.id;