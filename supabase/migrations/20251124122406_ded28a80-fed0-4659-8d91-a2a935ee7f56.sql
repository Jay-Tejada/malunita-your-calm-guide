-- Add cluster_label column to daily_focus_history table
ALTER TABLE daily_focus_history 
ADD COLUMN cluster_label text;