-- Add enriched task intelligence fields
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS follow_up TEXT,
ADD COLUMN IF NOT EXISTS is_tiny_task BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_bucket TEXT;