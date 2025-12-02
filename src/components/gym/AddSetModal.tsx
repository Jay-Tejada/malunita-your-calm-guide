import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

interface AddSetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
  'Barbell Row', 'Pull-ups', 'Lat Pulldown', 'Leg Press',
  'Incline Bench', 'Romanian Deadlift', 'Lunges', 'Dips'
];

const AddSetModal = ({ isOpen, onClose }: AddSetModalProps) => {
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentExercises, setRecentExercises] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRecentExercises();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset form
      setExercise('');
      setWeight('');
      setReps('');
    }
  }, [isOpen]);

  const fetchRecentExercises = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('exercise_sets')
      .select('exercise_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      const unique = [...new Set(data.map(d => d.exercise_name))].slice(0, 6);
      setRecentExercises(unique);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise.trim()) return;

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    // Get today's set count for this exercise
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('exercise_sets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('exercise_name', exercise.trim())
      .gte('created_at', `${today}T00:00:00`);

    const setNumber = (count || 0) + 1;

    const { error } = await supabase
      .from('exercise_sets')
      .insert({
        user_id: user.id,
        exercise_name: exercise.trim(),
        set_number: setNumber,
        weight: weight ? parseFloat(weight) : null,
        weight_unit: unit,
        reps: reps ? parseInt(reps) : null,
      });

    setIsSubmitting(false);
    if (!error) {
      onClose();
      // Force refresh by reloading the page section (we could use a callback instead)
      window.location.reload();
    }
  };

  const suggestions = exercise.trim() 
    ? [...recentExercises, ...COMMON_EXERCISES]
        .filter((e, i, arr) => arr.indexOf(e) === i) // unique
        .filter(e => e.toLowerCase().includes(exercise.toLowerCase()))
        .slice(0, 4)
    : recentExercises.length > 0 ? recentExercises : COMMON_EXERCISES.slice(0, 4);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center sm:items-center">
      <div className="bg-background w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-foreground/80">Add Set</h3>
          <button 
            onClick={onClose}
            className="p-1 text-foreground/40 hover:text-foreground/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exercise name */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-foreground/40 block mb-1.5">
              Exercise
            </label>
            <input
              ref={inputRef}
              type="text"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              placeholder="e.g. Bench Press"
              className="w-full bg-transparent border border-foreground/10 rounded-lg px-3 py-2 text-sm font-mono text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20"
            />
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setExercise(s)}
                    className="text-xs px-2 py-1 bg-foreground/5 text-foreground/50 rounded hover:bg-foreground/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Weight and Reps row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-widest text-foreground/40 block mb-1.5">
                Weight
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="135"
                  className="flex-1 bg-transparent border border-foreground/10 rounded-l-lg px-3 py-2 text-sm font-mono text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20"
                />
                <button
                  type="button"
                  onClick={() => setUnit(unit === 'lbs' ? 'kg' : 'lbs')}
                  className="px-3 py-2 border border-l-0 border-foreground/10 rounded-r-lg text-xs text-foreground/50 hover:text-foreground/70"
                >
                  {unit}
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-widest text-foreground/40 block mb-1.5">
                Reps
              </label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="8"
                className="w-full bg-transparent border border-foreground/10 rounded-lg px-3 py-2 text-sm font-mono text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!exercise.trim() || isSubmitting}
            className="w-full py-2.5 bg-foreground/10 text-foreground/70 rounded-lg text-sm font-medium hover:bg-foreground/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Adding...' : 'Add Set'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSetModal;
