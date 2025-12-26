-- Add raw_content field to tasks table for dual-layer content management
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS raw_content TEXT,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.raw_content IS 'Original unmodified user input - never truncated';
COMMENT ON COLUMN public.tasks.ai_summary IS 'AI-compressed semantic summary - display layer';
COMMENT ON COLUMN public.tasks.ai_confidence IS 'Confidence score from compression engine (0.0-1.0)';