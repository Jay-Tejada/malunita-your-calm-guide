-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Preferences
  preferred_input_style TEXT DEFAULT 'voice' CHECK (preferred_input_style IN ('voice', 'text')),
  wants_voice_playback BOOLEAN DEFAULT true,
  autocategorize_enabled BOOLEAN DEFAULT true,
  likes_routine_nudges BOOLEAN DEFAULT true,
  
  -- Activity patterns
  peak_activity_time TEXT DEFAULT 'morning',
  average_tasks_per_day INTEGER DEFAULT 0,
  total_tasks_logged INTEGER DEFAULT 0,
  
  -- Task patterns
  uses_reminders BOOLEAN DEFAULT true,
  uses_names BOOLEAN DEFAULT true,
  often_time_based BOOLEAN DEFAULT true,
  common_prefixes TEXT[] DEFAULT ARRAY[]::TEXT[]
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create tasks table to track user tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  title TEXT NOT NULL,
  context TEXT,
  category TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Pattern tracking
  keywords TEXT[],
  has_reminder BOOLEAN DEFAULT false,
  has_person_name BOOLEAN DEFAULT false,
  is_time_based BOOLEAN DEFAULT false,
  input_method TEXT DEFAULT 'voice' CHECK (input_method IN ('voice', 'text'))
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create conversation history table
CREATE TABLE public.conversation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  -- Metadata
  was_saved BOOLEAN DEFAULT false,
  audio_played BOOLEAN DEFAULT false
);

ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

-- Policies for conversation history
CREATE POLICY "Users can view their own conversations"
  ON public.conversation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.conversation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.conversation_history FOR DELETE
  USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update task statistics in profile
CREATE OR REPLACE FUNCTION public.update_profile_task_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_tasks_logged = (
      SELECT COUNT(*) FROM public.tasks WHERE user_id = NEW.user_id
    ),
    average_tasks_per_day = (
      SELECT ROUND(COUNT(*)::numeric / GREATEST(1, EXTRACT(DAY FROM (NOW() - MIN(created_at)))::numeric), 0)::integer
      FROM public.tasks 
      WHERE user_id = NEW.user_id
    )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when tasks are created
CREATE TRIGGER update_task_stats_on_insert
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_task_stats();