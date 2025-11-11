-- Add focus tracking to tasks
ALTER TABLE tasks ADD COLUMN is_focus BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN focus_date DATE;

-- Create index for fast focus queries
CREATE INDEX idx_tasks_focus ON tasks(user_id, is_focus, focus_date) WHERE is_focus = true;

-- Add a function to auto-clear old focus items
CREATE OR REPLACE FUNCTION clear_old_focus_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tasks
  SET is_focus = false
  WHERE is_focus = true 
  AND focus_date < CURRENT_DATE;
END;
$$;