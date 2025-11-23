-- Add display_order column to tasks table for drag-and-drop reordering
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_display_order ON public.tasks(display_order);

-- Add comment
COMMENT ON COLUMN public.tasks.display_order IS 'Order position for displaying tasks in lists (lower numbers appear first)';