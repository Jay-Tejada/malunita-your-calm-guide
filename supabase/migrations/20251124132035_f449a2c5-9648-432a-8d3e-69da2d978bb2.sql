-- Add auto_focus_enabled setting to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auto_focus_enabled boolean DEFAULT false;

-- Add source field to tasks to track auto vs manual focus
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS focus_source text DEFAULT NULL;
COMMENT ON COLUMN tasks.focus_source IS 'Tracks how focus was set: "manual" or "auto"';