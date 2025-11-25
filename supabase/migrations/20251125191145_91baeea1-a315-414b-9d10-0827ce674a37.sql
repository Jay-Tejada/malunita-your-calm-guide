-- Create ai_memory_profiles table
CREATE TABLE public.ai_memory_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  writing_style text,
  category_preferences jsonb DEFAULT '{}'::jsonb,
  priority_bias jsonb DEFAULT '{"must": 0.5, "should": 0.5, "could": 0.5}'::jsonb,
  tiny_task_threshold integer DEFAULT 5,
  energy_pattern jsonb DEFAULT '{"morning": 0.5, "afternoon": 0.5, "night": 0.5}'::jsonb,
  procrastination_triggers jsonb DEFAULT '[]'::jsonb,
  emotional_triggers jsonb DEFAULT '[]'::jsonb,
  positive_reinforcers jsonb DEFAULT '[]'::jsonb,
  streak_history jsonb DEFAULT '[]'::jsonb,
  last_updated timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_memory_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own memory profile"
ON public.ai_memory_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory profile"
ON public.ai_memory_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory profile"
ON public.ai_memory_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger to update last_updated timestamp
CREATE TRIGGER update_ai_memory_profiles_updated_at
BEFORE UPDATE ON public.ai_memory_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();