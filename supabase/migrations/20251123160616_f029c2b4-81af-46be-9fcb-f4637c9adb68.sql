-- Create weekly quests table
CREATE TABLE public.weekly_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  reward_affection INTEGER NOT NULL DEFAULT 0,
  reward_cosmetic_type TEXT,
  reward_cosmetic_id TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_quests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own quests"
  ON public.weekly_quests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quests"
  ON public.weekly_quests
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert quests"
  ON public.weekly_quests
  FOR INSERT
  WITH CHECK (is_service_role());

-- Create index for efficient queries
CREATE INDEX idx_weekly_quests_user_week ON public.weekly_quests(user_id, week_start);

-- Add update trigger
CREATE TRIGGER update_weekly_quests_updated_at
  BEFORE UPDATE ON public.weekly_quests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();