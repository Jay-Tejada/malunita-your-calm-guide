import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LastWorkoutSuggestion from './LastWorkoutSuggestion';
import RestTimer from './RestTimer';
import { normalizeExerciseName, searchExercises, getAllExercises } from '@/utils/exerciseNormalizer';

const DEFAULT_EXERCISES = getAllExercises();

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentExercise, setCurrentExercise] = useState<string | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);
  const [userExercises, setUserExercises] = useState<string[]>([]);

  // Fetch user's past exercise names on mount
  useEffect(() => {
    const stored = localStorage.getItem('malunita_exercises');
    if (stored) {
      setUserExercises(JSON.parse(stored));
    }
  }, []);

  // Combined search: canonical + user history (prioritize user history)
  const searchAllExercises = (query: string): string[] => {
    const canonical = searchExercises(query);
    const userMatches = userExercises.filter(e => 
      e.toLowerCase().includes(query.toLowerCase())
    );
    
    // Merge, dedupe, prioritize user history
    const combined = [...new Set([...userMatches, ...canonical])];
    return combined.slice(0, 5);
  };

  // Filter suggestions as user types and detect exercise name
  useEffect(() => {
    // Extract exercise name from input for autocomplete
    const match = input.match(/^(\d+\s+)?([a-zA-Z\s-]+)/);
    if (match && match[2]) {
      const exerciseQuery = match[2].trim();
      
      // Check if it's a known exercise (for LastWorkoutSuggestion)
      const normalized = normalizeExerciseName(exerciseQuery);
      if (normalized.toLowerCase() !== exerciseQuery.toLowerCase() || 
          userExercises.some((ex: string) => ex.toLowerCase() === exerciseQuery.toLowerCase())) {
        setCurrentExercise(normalized);
      } else {
        setCurrentExercise(null);
      }
      
      // Get autocomplete suggestions (combined canonical + user history)
      if (exerciseQuery.length >= 2 && !input.includes('x') && !input.includes('×')) {
        const results = searchAllExercises(exerciseQuery);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    } else {
      setCurrentExercise(null);
      setSuggestions([]);
    }
  }, [input, userExercises]);

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
        exercise: normalizeExerciseName(match[1].trim()),
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
      
      // Auto-start rest timer
      setShowRestTimer(true);
      
      // Track exercise name for future autocomplete
      if (!userExercises.some(e => e.toLowerCase() === parsed.exercise.toLowerCase())) {
        const updated = [parsed.exercise, ...userExercises].slice(0, 50);
        setUserExercises(updated);
        localStorage.setItem('malunita_exercises', JSON.stringify(updated));
      }
      
      // Save last set for this exercise (for suggestions)
      const exerciseKey = `malunita_exercise_${parsed.exercise.toLowerCase().replace(/\s+/g, '_')}`;
      localStorage.setItem(exerciseKey, JSON.stringify({ weight: parsed.weight, reps: parsed.reps }));
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
      
      {/* Rest Timer - auto-starts after logging */}
      {showRestTimer && (
        <div className="mb-4">
          <RestTimer 
            autoStart={true}
            defaultSeconds={restSeconds}
            onComplete={() => setShowRestTimer(false)}
          />
        </div>
      )}
      
      {/* Rest time preference */}
      <div className="flex items-center gap-2 mb-4">
        <p className="text-[10px] text-foreground/40">Rest:</p>
        {[60, 90, 120, 180].map(s => (
          <button
            key={s}
            onClick={() => setRestSeconds(s)}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
              restSeconds === s 
                ? 'bg-foreground/10 text-foreground/60' 
                : 'text-foreground/30 hover:text-foreground/50'
            }`}
          >
            {s >= 60 ? `${s/60}m` : `${s}s`}
          </button>
        ))}
      </div>
      
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
      
      {/* Autocomplete suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestions.map(exercise => (
            <button
              key={exercise}
              onClick={() => {
                // Replace exercise name in input with canonical
                const repsMatch = input.match(/^(\d+)\s+/);
                if (repsMatch) {
                  setInput(`${repsMatch[1]} ${exercise}`);
                } else {
                  setInput(exercise + ' ');
                }
                setSuggestions([]);
              }}
              className="px-2 py-1 text-xs bg-foreground/5 hover:bg-foreground/10 rounded text-foreground/60 transition-colors"
            >
              {exercise}
            </button>
          ))}
        </div>
      )}
      
      {/* Last workout suggestion */}
      {currentExercise && <LastWorkoutSuggestion exercise={currentExercise} />}
      
      <p className="text-[10px] text-foreground/30 mt-1">
        Format: exercise weight × reps
      </p>
    </div>
  );
};

export default WorkoutLog;
