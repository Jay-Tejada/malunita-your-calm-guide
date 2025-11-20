-- Add recurrence fields to tasks table
ALTER TABLE tasks 
ADD COLUMN recurrence_pattern text CHECK (recurrence_pattern IN ('none', 'daily', 'weekly', 'monthly')) DEFAULT 'none',
ADD COLUMN recurrence_day integer CHECK (recurrence_day >= 0 AND recurrence_day <= 6),
ADD COLUMN recurrence_end_date timestamp with time zone;

-- Add index for querying recurring reminders
CREATE INDEX idx_tasks_recurrence ON tasks(recurrence_pattern, reminder_time) WHERE recurrence_pattern != 'none';