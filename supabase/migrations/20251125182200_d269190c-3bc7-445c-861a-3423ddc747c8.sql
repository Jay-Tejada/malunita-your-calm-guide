-- Add ai_metadata column to tasks table to store original AI output for corrections
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN tasks.ai_metadata IS 'Stores the original AI classification output including category, priority, bucket, and subtasks for correction tracking';