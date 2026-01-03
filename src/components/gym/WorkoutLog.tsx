import { useState, useEffect, useRef } from 'react';
import { Plus, Check, X, AlertCircle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  normalizeExerciseName, 
  searchExercises,
  NormalizationResult 
} from '@/utils/exerciseNormalizer';
import LastWorkoutSuggestion from './LastWorkoutSuggestion';
import RestTimer from './RestTimer';
import SwipeableSetItem from './SwipeableSetItem';
import { useToast } from '@/hooks/use-toast';

interface ExerciseSet {
  id: string;
  exercise_name: string;
  weight: number | null;
  reps: number | null;
  duration: number | null;
  is_bodyweight: boolean;
  created_at: string;
  isPR?: boolean;
}

interface ParsedExercise {
  exercise: string;
  weight: number | null;
  reps: number | null;
  duration?: number | null;
  isBodyweight: boolean;
}

interface PendingConfirmation {
  parsed: ParsedExercise;
  normalization: NormalizationResult;
}

interface DeletedSet {
  set: ExerciseSet;
  timeoutId: NodeJS.Timeout;
}

const WorkoutLog = () => {
  const [inputValue, setInputValue] = useState('');
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [userExercises, setUserExercises] = useState<string[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);
  const [currentExercise, setCurrentExercise] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState<ExerciseSet | null>(null);
  const [deletedSet, setDeletedSet] = useState<DeletedSet | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load user's exercise history
  useEffect(() => {
    const stored = localStorage.getItem('malunita_exercises');
    if (stored) {
      setUserExercises(JSON.parse(stored));
    }
  }, []);

  // Load today's sets from Supabase
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
        exercise_name: d.exercise_name,
        weight: d.weight,
        reps: d.reps,
        duration: null,
        is_bodyweight: !d.weight,
        created_at: d.created_at || new Date().toISOString(),
        isPR: d.is_pr
      })));
    }
    setIsLoading(false);
  };

  // Update autocomplete suggestions as user types
  useEffect(() => {
    const match = inputValue.match(/^(\d+\s+)?([a-zA-Z\s-]+)/);
    if (match && match[2] && match[2].trim().length >= 2) {
      const exerciseQuery = match[2].trim();
      
      // Check if it's a known exercise (for LastWorkoutSuggestion)
      const normalized = normalizeExerciseName(exerciseQuery);
      if (!normalized.isNew || 
          userExercises.some((ex: string) => ex.toLowerCase() === exerciseQuery.toLowerCase())) {
        setCurrentExercise(normalized.canonical);
      } else {
        setCurrentExercise(null);
      }
      
      // Only show suggestions before the x/× is typed
      if (!inputValue.includes('x') && !inputValue.includes('×')) {
        const results = searchExercises(exerciseQuery, userExercises);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setCurrentExercise(null);
    }
  }, [inputValue, userExercises]);

  const parseWorkoutInput = (input: string): ParsedExercise | null => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return null;

    // Pattern 1: "exercise weight x reps" (e.g., "bench 135x10")
    const weightedPattern = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?\s*[x×]\s*(\d+)$/i;
    const weightedMatch = trimmed.match(weightedPattern);
    if (weightedMatch) {
      return {
        exercise: weightedMatch[1].trim(),
        weight: parseFloat(weightedMatch[2]),
        reps: parseInt(weightedMatch[3]),
        isBodyweight: false,
      };
    }

    // Pattern 2: "reps exercise" (e.g., "25 push-ups")
    const repsFirstPattern = /^(\d+)\s+(.+)$/i;
    const repsFirstMatch = trimmed.match(repsFirstPattern);
    if (repsFirstMatch) {
      return {
        exercise: repsFirstMatch[2].trim(),
        weight: null,
        reps: parseInt(repsFirstMatch[1]),
        isBodyweight: true,
      };
    }

    // Pattern 3: "exercise x reps" or "exercise reps" (e.g., "push-ups x 25")
    const exerciseFirstPattern = /^([a-zA-Z\s-]+?)\s*[x×]?\s*(\d+)$/i;
    const exerciseFirstMatch = trimmed.match(exerciseFirstPattern);
    if (exerciseFirstMatch) {
      return {
        exercise: exerciseFirstMatch[1].trim(),
        weight: null,
        reps: parseInt(exerciseFirstMatch[2]),
        isBodyweight: true,
      };
    }

    // Pattern 4: Time-based (e.g., "plank 60s")
    const timePattern = /^(.+?)\s+(\d+)\s*(?:s|sec|seconds?)$/i;
    const timeMatch = trimmed.match(timePattern);
    if (timeMatch) {
      return {
        exercise: timeMatch[1].trim(),
        weight: null,
        reps: null,
        duration: parseInt(timeMatch[2]),
        isBodyweight: true,
      };
    }

    return null;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    
    // If editing, update instead of create
    if (editingSet) {
      handleUpdateSet();
      return;
    }
    
    const parsed = parseWorkoutInput(inputValue);
    
    if (!parsed) {
      setError('Try: "25 push-ups" or "bench 135x10"');
      return;
    }

    // Normalize the exercise name
    const normalization = normalizeExerciseName(parsed.exercise);
    
    if (normalization.isNew && normalization.suggestions.length > 0) {
      // Unknown exercise with suggestions - ask for confirmation
      setPendingConfirmation({ parsed, normalization });
    } else {
      // Known exercise or no suggestions - add directly
      addExerciseSet({ ...parsed, exercise: normalization.canonical });
    }
  };

  const handleConfirmNewExercise = () => {
    if (pendingConfirmation) {
      addExerciseSet({
        ...pendingConfirmation.parsed,
        exercise: pendingConfirmation.normalization.canonical,
      });
      setPendingConfirmation(null);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (pendingConfirmation) {
      addExerciseSet({
        ...pendingConfirmation.parsed,
        exercise: suggestion,
      });
      setPendingConfirmation(null);
    }
  };

  const handleCancelConfirmation = () => {
    setPendingConfirmation(null);
    inputRef.current?.focus();
  };

  const addExerciseSet = async (parsed: ParsedExercise) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to log your workouts",
        variant: "destructive",
      });
      return;
    }

    // Get set number for this exercise today
    const exerciseSetsToday = sets.filter(
      s => s.exercise_name.toLowerCase() === parsed.exercise.toLowerCase()
    );
    const setNumber = exerciseSetsToday.length + 1;

    const { data, error: insertError } = await supabase
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

    if (insertError) {
      toast({
        title: "Failed to log set",
        description: insertError.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      const newSet: ExerciseSet = {
        id: data.id,
        exercise_name: data.exercise_name,
        weight: data.weight,
        reps: data.reps,
        duration: parsed.duration || null,
        is_bodyweight: parsed.isBodyweight,
        created_at: data.created_at || new Date().toISOString(),
        isPR: data.is_pr
      };

      setSets(prev => [...prev, newSet]);
      
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
      
      // Visual feedback
      setRecentlyAdded(newSet.id);
      setTimeout(() => setRecentlyAdded(null), 1500);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Clear and refocus
      setInputValue('');
      setSuggestions([]);
      inputRef.current?.focus();
    }
  };

  const handleDeleteSet = (set: ExerciseSet) => {
    // Clear any existing undo timeout
    if (deletedSet) {
      clearTimeout(deletedSet.timeoutId);
      // Actually delete the previous one from DB
      performDelete(deletedSet.set.id);
    }

    // Optimistically remove from UI
    setSets(prev => prev.filter(s => s.id !== set.id));
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }

    // Set up undo with timeout
    const timeoutId = setTimeout(() => {
      performDelete(set.id);
      setDeletedSet(null);
    }, 5000);

    setDeletedSet({ set, timeoutId });

    // Show toast with undo
    toast({
      description: (
        <div className="flex items-center justify-between w-full">
          <span>Set deleted</span>
          <button 
            onClick={() => handleUndoDelete(set, timeoutId)}
            className="ml-4 px-2 py-1 text-xs bg-foreground/10 hover:bg-foreground/20 rounded transition-colors"
          >
            Undo
          </button>
        </div>
      ),
      duration: 5000,
    });
  };

  const performDelete = async (setId: string) => {
    await supabase.from('exercise_sets').delete().eq('id', setId);
  };

  const handleUndoDelete = (set: ExerciseSet, timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId);
    setSets(prev => [...prev, set].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ));
    setDeletedSet(null);
    
    toast({
      description: "Set restored",
      duration: 2000,
    });
  };

  const handleEditSet = (set: ExerciseSet) => {
    setEditingSet(set);
    // Pre-fill input with set data
    if (set.is_bodyweight) {
      setInputValue(`${set.reps} ${set.exercise_name}`);
    } else {
      setInputValue(`${set.exercise_name} ${set.weight}x${set.reps}`);
    }
    inputRef.current?.focus();
  };

  const handleUpdateSet = async () => {
    if (!editingSet) return;
    
    const parsed = parseWorkoutInput(inputValue);
    if (!parsed) {
      setError('Invalid format');
      return;
    }

    const normalization = normalizeExerciseName(parsed.exercise);

    const { error: updateError } = await supabase
      .from('exercise_sets')
      .update({
        exercise_name: normalization.canonical,
        weight: parsed.weight,
        reps: parsed.reps,
      })
      .eq('id', editingSet.id);

    if (!updateError) {
      setSets(prev => prev.map(s => 
        s.id === editingSet.id 
          ? { 
              ...s, 
              exercise_name: normalization.canonical,
              weight: parsed.weight, 
              reps: parsed.reps,
              is_bodyweight: parsed.isBodyweight,
            } 
          : s
      ));
      
      toast({
        description: "Set updated",
        duration: 2000,
      });
    }

    setEditingSet(null);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingSet(null);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape' && editingSet) {
      handleCancelEdit();
    }
  };

  const selectAutocomplete = (exercise: string) => {
    const repsMatch = inputValue.match(/^(\d+)\s+/);
    if (repsMatch) {
      setInputValue(`${repsMatch[1]} ${exercise}`);
    } else {
      setInputValue(exercise + ' ');
    }
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Group sets by exercise name
  const groupedSets = sets.reduce((acc, set) => {
    if (!acc[set.exercise_name]) acc[set.exercise_name] = [];
    acc[set.exercise_name].push(set);
    return acc;
  }, {} as Record<string, ExerciseSet[]>);

  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-foreground/30">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Today's log */}
      {Object.keys(groupedSets).length > 0 && (
        <div className="space-y-3">
          {Object.entries(groupedSets).map(([exercise, exerciseSets]) => {
            const lastSet = exerciseSets[exerciseSets.length - 1];
            
            const handleRepeatSet = () => {
              if (!lastSet) return;
              addExerciseSet({
                exercise: lastSet.exercise_name,
                weight: lastSet.weight,
                reps: lastSet.reps,
                isBodyweight: lastSet.is_bodyweight,
              });
            };
            
            return (
              <div key={exercise}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-mono text-sm text-foreground/70">{exercise}</p>
                  <button
                    onClick={handleRepeatSet}
                    className="p-1.5 rounded-md text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors"
                    title="Repeat last set"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="pl-4 space-y-0.5">
                  {exerciseSets.map((set) => (
                    <SwipeableSetItem
                      key={set.id}
                      set={set}
                      isRecentlyAdded={recentlyAdded === set.id}
                      onDelete={handleDeleteSet}
                      onEdit={handleEditSet}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest Timer */}
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
      <div className="flex items-center gap-2">
        <p className="text-[10px] text-foreground/40">Rest:</p>
        {[60, 90, 120, 180, 600].map(s => (
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

      {/* Input area */}
      <div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingSet ? "Edit set..." : "bench 135x10"}
            className={`flex-1 bg-transparent border-b py-2 font-mono text-sm text-foreground/70 placeholder:text-foreground/30 focus:outline-none transition-colors ${
              editingSet 
                ? 'border-amber-500/30 focus:border-amber-500/50' 
                : 'border-foreground/10 focus:border-foreground/20'
            }`}
          />
          {editingSet ? (
            <>
              <button
                onClick={handleUpdateSet}
                className="p-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg text-amber-500/70"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-foreground/5 rounded-lg text-foreground/40"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => handleSubmit()}
              className="p-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-foreground/50"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Editing indicator */}
        {editingSet && (
          <p className="text-xs text-amber-500/60 mt-1">
            Editing set · Press Esc to cancel
          </p>
        )}
        
        {/* Autocomplete suggestions */}
        {suggestions.length > 0 && !pendingConfirmation && !editingSet && (
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestions.map(exercise => (
              <button
                key={exercise}
                onClick={() => selectAutocomplete(exercise)}
                className="px-2 py-1 text-xs bg-foreground/5 hover:bg-foreground/10 rounded text-foreground/60 transition-colors"
              >
                {exercise}
              </button>
            ))}
          </div>
        )}
        
        {/* Last workout suggestion */}
        {currentExercise && !pendingConfirmation && !editingSet && (
          <LastWorkoutSuggestion exercise={currentExercise} />
        )}
        
        {/* Error message */}
        {error && !pendingConfirmation && (
          <p className="text-xs text-red-400/70 mt-2">{error}</p>
        )}
        
        {/* Hint */}
        {!error && !pendingConfirmation && !editingSet && suggestions.length === 0 && !currentExercise && (
          <p className="text-[10px] text-foreground/30 mt-1">
            Format: exercise weight × reps · Swipe left to delete
          </p>
        )}
      </div>

      {/* "Did you mean?" confirmation */}
      {pendingConfirmation && (
        <div className="p-4 bg-foreground/[0.02] border border-foreground/10 rounded-lg animate-fade-in">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-500/70 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground/70 mb-1">
                New exercise: <span className="font-mono">"{pendingConfirmation.normalization.canonical}"</span>
              </p>
              <p className="text-xs text-foreground/40">
                Did you mean one of these?
              </p>
            </div>
          </div>
          
          {/* Suggestions */}
          <div className="space-y-2 mb-4">
            {pendingConfirmation.normalization.suggestions.map(suggestion => (
              <button
                key={suggestion}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full flex items-center justify-between px-3 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-sm text-foreground/70 transition-colors"
              >
                <span className="font-mono">{suggestion}</span>
                <Check className="w-4 h-4 text-foreground/40" />
              </button>
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleConfirmNewExercise}
              className="flex-1 px-3 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-xs text-foreground/60 transition-colors"
            >
              Keep "{pendingConfirmation.normalization.canonical}"
            </button>
            <button
              onClick={handleCancelConfirmation}
              className="p-2 hover:bg-foreground/5 rounded-lg text-foreground/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLog;
