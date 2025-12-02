import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseSet {
  id: string;
  exercise: string;
  weight: number;
  reps: number;
  isPR?: boolean;
}

const WorkoutLog = () => {
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodaySets();
  }, []);

  const fetchTodaySets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setSets(data.map(d => ({
        id: d.id,
        exercise: d.exercise_name,
        weight: d.weight || 0,
        reps: d.reps || 0,
        isPR: d.is_pr
      })));
    }
    setIsLoading(false);
  };

  // Parse input like "bench 135x10" or "squat 225 x 5"
  const parseSetInput = (text: string) => {
    const match = text.match(/^(.+?)\s+(\d+)\s*(?:lbs|kg)?\s*[x×]\s*(\d+)$/i);
    if (match) {
      return {
        exercise: match[1].trim(),
        weight: parseInt(match[2]),
        reps: parseInt(match[3]),
      };
    }
    return null;
  };

  const handleAddSet = async () => {
    const parsed = parseSetInput(input);
    if (!parsed) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get set number for this exercise today
    const exerciseSetsToday = sets.filter(
      s => s.exercise.toLowerCase() === parsed.exercise.toLowerCase()
    );
    const setNumber = exerciseSetsToday.length + 1;

    const { data, error } = await supabase
      .from('exercise_sets')
      .insert({
        user_id: user.id,
        exercise_name: parsed.exercise,
        set_number: setNumber,
        weight: parsed.weight,
        weight_unit: 'lbs',
        reps: parsed.reps,
      })
      .select()
      .single();

    if (!error && data) {
      setSets([...sets, {
        id: data.id,
        exercise: data.exercise_name,
        weight: data.weight || 0,
        reps: data.reps || 0,
        isPR: data.is_pr
      }]);
      setInput('');
    }
  };

  // Group sets by exercise
  const groupedSets = sets.reduce((acc, set) => {
    const key = set.exercise.toLowerCase();
    if (!acc[key]) acc[key] = { name: set.exercise, sets: [] };
    acc[key].sets.push(set);
    return acc;
  }, {} as Record<string, { name: string; sets: ExerciseSet[] }>);

  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-foreground/30">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Grouped exercises */}
      {Object.entries(groupedSets).map(([key, { name, sets: exerciseSets }]) => (
        <div key={key} className="mb-4">
          <p className="font-mono text-sm text-foreground/70 capitalize mb-1">
            {name}
          </p>
          <div className="pl-4 space-y-0.5">
            {exerciseSets.map((set) => (
              <p key={set.id} className="font-mono text-sm text-foreground/50">
                {set.weight} × {set.reps}
                {set.isPR && <span className="ml-2 text-amber-500 text-xs">PR</span>}
              </p>
            ))}
          </div>
        </div>
      ))}
      
      {sets.length === 0 && (
        <p className="text-xs text-foreground/30 py-4">No sets logged yet</p>
      )}
      
      {/* Quick add input */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAddSet()}
        placeholder="bench 135x10"
        className="w-full bg-transparent border-b border-foreground/10 py-2 font-mono text-sm text-foreground/70 placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20"
      />
      <p className="text-[10px] text-foreground/30 mt-1">
        Format: exercise weight × reps
      </p>
    </div>
  );
};

export default WorkoutLog;
