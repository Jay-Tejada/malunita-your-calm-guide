-- Create ai_corrections table to store all correction feedback
CREATE TABLE IF NOT EXISTS ai_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  task_title TEXT NOT NULL,
  original_text TEXT,
  
  -- AI's original output
  ai_guess JSONB NOT NULL DEFAULT '{}',
  
  -- User's corrected output
  corrected_output JSONB NOT NULL DEFAULT '{}',
  
  -- Context snapshot at time of correction
  context_snapshot JSONB DEFAULT '{}',
  
  -- Was this marked as "not a task"?
  is_not_task BOOLEAN DEFAULT false,
  
  -- Correction metadata
  correction_type TEXT,
  confidence_score NUMERIC,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_corrections_user_id ON ai_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_corrections_created_at ON ai_corrections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_corrections_processed ON ai_corrections(processed_at) WHERE processed_at IS NULL;

-- Enable RLS
ALTER TABLE ai_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own corrections"
  ON ai_corrections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own corrections"
  ON ai_corrections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all corrections"
  ON ai_corrections FOR ALL
  USING (is_service_role());

COMMENT ON TABLE ai_corrections IS 'Stores all AI correction feedback from users to train the thought engine';

-- Create user_bias_patterns table
CREATE TABLE IF NOT EXISTS user_bias_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  pattern_type TEXT NOT NULL,
  pattern_key TEXT NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC DEFAULT 0.5,
  sample_size INTEGER DEFAULT 0,
  
  first_observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, pattern_type, pattern_key)
);

CREATE INDEX IF NOT EXISTS idx_user_bias_patterns_user_id ON user_bias_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bias_patterns_confidence ON user_bias_patterns(confidence DESC);

ALTER TABLE user_bias_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patterns"
  ON user_bias_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all patterns"
  ON user_bias_patterns FOR ALL
  USING (is_service_role());

COMMENT ON TABLE user_bias_patterns IS 'Tracks user-specific patterns and biases learned from corrections';

-- Create model_confusion_matrix table
CREATE TABLE IF NOT EXISTS model_confusion_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  predicted_category TEXT,
  predicted_priority TEXT,
  actual_category TEXT,
  actual_priority TEXT,
  
  occurrence_count INTEGER DEFAULT 1,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  common_phrases TEXT[] DEFAULT '{}',
  
  UNIQUE(predicted_category, predicted_priority, actual_category, actual_priority)
);

CREATE INDEX IF NOT EXISTS idx_confusion_matrix_predicted ON model_confusion_matrix(predicted_category, predicted_priority);
CREATE INDEX IF NOT EXISTS idx_confusion_matrix_actual ON model_confusion_matrix(actual_category, actual_priority);

ALTER TABLE model_confusion_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage confusion matrix"
  ON model_confusion_matrix FOR ALL
  USING (is_service_role());

CREATE POLICY "Admins can view confusion matrix"
  ON model_confusion_matrix FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE model_confusion_matrix IS 'Tracks which categories and priorities the AI commonly confuses';

-- Create training_queue table
CREATE TABLE IF NOT EXISTS training_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  training_type TEXT NOT NULL DEFAULT 'weekly',
  corrections_since_last INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  improvements JSONB DEFAULT '{}',
  error_log TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_queue_status ON training_queue(status, scheduled_for);

ALTER TABLE training_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage training queue"
  ON training_queue FOR ALL
  USING (is_service_role());

CREATE POLICY "Admins can view training queue"
  ON training_queue FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE training_queue IS 'Queues training jobs based on correction thresholds';

-- Create function to auto-update timestamp
CREATE OR REPLACE FUNCTION update_user_bias_patterns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_bias_patterns_updated_at
  BEFORE UPDATE ON user_bias_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_user_bias_patterns_timestamp();