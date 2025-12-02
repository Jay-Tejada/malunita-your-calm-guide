import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfWeek } from 'date-fns';

interface WorkoutSet {
  exercise_name: string;
  weight: number | null;
  reps: number | null;
  created_at?: string;
}

const WeeklyReflection = () => {
  const [reflection, setReflection] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    generateReflection();
  }, []);
  
  const getWorkoutsThisWeek = async (): Promise<WorkoutSet[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    
    const { data, error } = await supabase
      .from('exercise_sets')
      .select('exercise_name, weight, reps, created_at')
      .eq('user_id', user.id)
      .gte('created_at', weekStart)
      .order('created_at', { ascending: true });
    
    if (error || !data) return [];
    return data;
  };
  
  const getBodyCheckInsThisWeek = (): string[] => {
    const stored = localStorage.getItem('malunita_body_checkins');
    if (!stored) return [];
    
    const checkins: { date: string; note: string }[] = JSON.parse(stored);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    return checkins
      .filter(c => new Date(c.date) >= weekStart)
      .map(c => c.note);
  };
  
  const generateReflection = async () => {
    setIsLoading(true);
    
    const workouts = await getWorkoutsThisWeek();
    const notes = getBodyCheckInsThisWeek();
    
    if (workouts.length === 0) {
      setReflection(null);
      setIsLoading(false);
      return;
    }
    
    // Count unique training days
    const uniqueDays = new Set(
      workouts.map(w => w.created_at?.split('T')[0])
    );
    const totalSessions = uniqueDays.size;
    
    // Get unique exercises
    const exercises = workouts.map(w => w.exercise_name);
    const uniqueExercises = [...new Set(exercises)];
    
    // Calculate total volume
    const totalSets = workouts.length;
    
    let text = `You trained ${totalSessions} day${totalSessions > 1 ? 's' : ''} this week, logging ${totalSets} sets.`;
    
    if (uniqueExercises.length > 0) {
      const topExercises = uniqueExercises.slice(0, 3).join(', ');
      text += ` Focused on ${topExercises}.`;
    }
    
    // Check for fatigue/pain mentions in body check-ins
    const concernKeywords = ['tired', 'fatigue', 'sore', 'pain', 'tight', 'stiff'];
    const fatigueMentions = notes.filter(n => 
      concernKeywords.some(k => n.toLowerCase().includes(k))
    );
    
    if (fatigueMentions.length > 0) {
      text += ` You noted discomfort ${fatigueMentions.length} time${fatigueMentions.length > 1 ? 's' : ''} — consider extra recovery.`;
    }
    
    // Positive reinforcement
    if (totalSessions >= 3) {
      text += ' Great consistency!';
    } else if (totalSessions >= 1) {
      text += ' Keep building momentum.';
    }
    
    setReflection(text);
    setIsLoading(false);
  };
  
  if (isLoading) return null;
  if (!reflection) return null;

  return (
    <div className="py-3 px-4 bg-foreground/[0.02] rounded-lg">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <p className="text-[10px] uppercase tracking-widest text-foreground/40">
          Weekly Reflection
        </p>
        <ChevronDown className={`w-4 h-4 text-foreground/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {isExpanded && (
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed animate-fade-in">
          {reflection}
        </p>
      )}
    </div>
  );
};

export default WeeklyReflection;
