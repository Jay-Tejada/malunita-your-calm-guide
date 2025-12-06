-- Ritual history tracking
CREATE TABLE IF NOT EXISTS ritual_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('morning', 'night')),
  payload jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Add index for user queries
CREATE INDEX idx_ritual_history_user ON ritual_history(user_id, created_at DESC);

-- Add RLS
ALTER TABLE ritual_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rituals" ON ritual_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rituals" ON ritual_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);