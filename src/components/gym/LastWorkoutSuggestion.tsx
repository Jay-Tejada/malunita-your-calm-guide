import { useState, useEffect } from 'react';

interface LastWorkoutSuggestionProps {
  exercise: string;
}

const LastWorkoutSuggestion = ({ exercise }: LastWorkoutSuggestionProps) => {
  const [lastSet, setLastSet] = useState<{ weight: number; reps: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    setDismissed(false);
    const key = `malunita_exercise_${exercise.toLowerCase().replace(/\s+/g, '_')}`;
    const history = localStorage.getItem(key);
    if (history) {
      setLastSet(JSON.parse(history));
    } else {
      setLastSet(null);
    }
  }, [exercise]);
  
  if (!lastSet || dismissed) return null;
  
  const suggestedWeight = lastSet.weight + 5;
  
  return (
    <div className="flex items-center gap-2 mt-2 animate-fade-in">
      <p className="text-xs text-foreground/40">
        Last: {lastSet.weight}×{lastSet.reps} — try {suggestedWeight}?
      </p>
      <button 
        onClick={() => setDismissed(true)}
        className="text-[10px] text-foreground/30 hover:text-foreground/50"
      >
        ×
      </button>
    </div>
  );
};

export default LastWorkoutSuggestion;
