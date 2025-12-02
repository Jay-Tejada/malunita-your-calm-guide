-- Workout sessions
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_type TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise sets (the actual log)
CREATE TABLE public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight DECIMAL,
  weight_unit TEXT DEFAULT 'lbs',
  reps INTEGER,
  is_pr BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal records (auto-tracked)
CREATE TABLE public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  weight DECIMAL NOT NULL,
  reps INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_name)
);

-- Enable RLS
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- Workout sessions policies
CREATE POLICY "Users can view own workout_sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workout_sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout_sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout_sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Exercise sets policies
CREATE POLICY "Users can view own exercise_sets" ON public.exercise_sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exercise_sets" ON public.exercise_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise_sets" ON public.exercise_sets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise_sets" ON public.exercise_sets
  FOR DELETE USING (auth.uid() = user_id);

-- Personal records policies
CREATE POLICY "Users can view own personal_records" ON public.personal_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own personal_records" ON public.personal_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal_records" ON public.personal_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal_records" ON public.personal_records
  FOR DELETE USING (auth.uid() = user_id);