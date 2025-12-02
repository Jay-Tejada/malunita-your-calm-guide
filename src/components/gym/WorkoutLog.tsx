import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dumbbell, Trash2 } from 'lucide-react';

interface ExerciseSet {
  id: string;
  exercise_name: string;
  set_number: number;
  weight: number | null;
  weight_unit: string;
  reps: number | null;
  is_pr: boolean;
}

const WorkoutLog = () => {
  const [sets, setSets] = useState<ExerciseSet[]>([]);
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
      setSets(data);
    }
    setIsLoading(false);
  };

  const deleteSet = async (id: string) => {
    const { error } = await supabase
      .from('exercise_sets')
      .delete()
      .eq('id', id);

    if (!error) {
      setSets(sets.filter(s => s.id !== id));
    }
  };

  // Group sets by exercise
  const groupedSets = sets.reduce((acc, set) => {
    if (!acc[set.exercise_name]) {
      acc[set.exercise_name] = [];
    }
    acc[set.exercise_name].push(set);
    return acc;
  }, {} as Record<string, ExerciseSet[]>);

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-xs text-foreground/30">Loading...</p>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="py-8 text-center">
        <Dumbbell className="w-6 h-6 mx-auto mb-2 text-foreground/20" />
        <p className="text-xs text-foreground/30">No sets logged today</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedSets).map(([exerciseName, exerciseSets]) => (
        <div key={exerciseName} className="bg-foreground/[0.02] rounded-lg p-3">
          <p className="text-sm font-medium text-foreground/70 mb-2">{exerciseName}</p>
          <div className="space-y-1">
            {exerciseSets.map((set) => (
              <div 
                key={set.id} 
                className="flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-foreground/30 w-4">{set.set_number}.</span>
                  <span className="text-foreground/60 font-mono">
                    {set.weight ? `${set.weight} ${set.weight_unit}` : '—'}
                  </span>
                  <span className="text-foreground/40">×</span>
                  <span className="text-foreground/60 font-mono">
                    {set.reps ?? '—'} reps
                  </span>
                  {set.is_pr && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">
                      PR
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteSet(set.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-foreground/30 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkoutLog;
