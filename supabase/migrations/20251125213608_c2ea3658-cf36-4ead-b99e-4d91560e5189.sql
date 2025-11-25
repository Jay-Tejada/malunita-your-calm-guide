-- Add plan_id column to tasks table for grouping related tasks under a plan
ALTER TABLE tasks ADD COLUMN plan_id uuid REFERENCES tasks(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_tasks_plan_id ON tasks(plan_id) WHERE plan_id IS NOT NULL;

-- Add RLS policy to ensure users can only see plans for their own tasks
-- (existing RLS policies on tasks table already cover this, but adding comment for clarity)