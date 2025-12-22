-- Add dedicated link_url field to tasks table
ALTER TABLE public.tasks 
ADD COLUMN link_url text;