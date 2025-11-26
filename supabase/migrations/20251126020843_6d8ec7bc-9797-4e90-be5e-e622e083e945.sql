-- Add staleness_status field to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS staleness_status text DEFAULT 'active';

-- Create index for faster queries on incomplete tasks
CREATE INDEX IF NOT EXISTS idx_tasks_staleness ON tasks(completed, created_at, staleness_status) 
WHERE completed = false;