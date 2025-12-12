
-- Create canvas projects table (extends existing projects concept)
CREATE TABLE public.canvas_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project pages table
CREATE TABLE public.project_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.canvas_projects(id) ON DELETE CASCADE,
  parent_page_id UUID REFERENCES public.project_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  page_type TEXT NOT NULL DEFAULT 'canvas', -- canvas, idea_board, structured_doc, gallery
  icon TEXT DEFAULT '📄',
  is_collapsed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create page blocks table
CREATE TABLE public.page_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.project_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'text', -- text, heading, list, checklist, image, divider, callout, synced
  content JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  indent_level INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gallery items table
CREATE TABLE public.gallery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.project_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create idea board items table
CREATE TABLE public.idea_board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.project_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'sticky', -- sticky, image, arrow, highlight
  content JSONB DEFAULT '{}'::jsonb,
  position_x NUMERIC DEFAULT 100,
  position_y NUMERIC DEFAULT 100,
  width NUMERIC DEFAULT 200,
  height NUMERIC DEFAULT 150,
  color TEXT DEFAULT '#fef3c7',
  z_index INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.canvas_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_board_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for canvas_projects
CREATE POLICY "Users can view their own canvas projects"
ON public.canvas_projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own canvas projects"
ON public.canvas_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own canvas projects"
ON public.canvas_projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own canvas projects"
ON public.canvas_projects FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for project_pages
CREATE POLICY "Users can view their own project pages"
ON public.project_pages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project pages"
ON public.project_pages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project pages"
ON public.project_pages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project pages"
ON public.project_pages FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for page_blocks
CREATE POLICY "Users can view their own page blocks"
ON public.page_blocks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own page blocks"
ON public.page_blocks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own page blocks"
ON public.page_blocks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own page blocks"
ON public.page_blocks FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for gallery_items
CREATE POLICY "Users can view their own gallery items"
ON public.gallery_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gallery items"
ON public.gallery_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery items"
ON public.gallery_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery items"
ON public.gallery_items FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for idea_board_items
CREATE POLICY "Users can view their own idea board items"
ON public.idea_board_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own idea board items"
ON public.idea_board_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own idea board items"
ON public.idea_board_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own idea board items"
ON public.idea_board_items FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_project_pages_project_id ON public.project_pages(project_id);
CREATE INDEX idx_project_pages_parent_id ON public.project_pages(parent_page_id);
CREATE INDEX idx_page_blocks_page_id ON public.page_blocks(page_id);
CREATE INDEX idx_gallery_items_page_id ON public.gallery_items(page_id);
CREATE INDEX idx_idea_board_items_page_id ON public.idea_board_items(page_id);

-- Trigger for updated_at
CREATE TRIGGER update_canvas_projects_updated_at
BEFORE UPDATE ON public.canvas_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_pages_updated_at
BEFORE UPDATE ON public.project_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_blocks_updated_at
BEFORE UPDATE ON public.page_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_idea_board_items_updated_at
BEFORE UPDATE ON public.idea_board_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
