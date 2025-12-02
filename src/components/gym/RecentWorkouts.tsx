import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, parseISO } from 'date-fns';

interface WorkoutDay {
  date: string;
  exercises: string[];
  totalSets: number;
}

const RecentWorkouts = () => {
  const [workouts, setWorkouts] = useState<WorkoutDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentWorkouts();
  }, []);

  const fetchRecentWorkouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const sevenDaysAgo = subDays(new Date(), 7).toISOString();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('exercise_sets')
      .select('exercise_name, created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo)
      .lt('created_at', `${today}T00:00:00`) // Exclude today
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Group by date
      const grouped = data.reduce((acc, set) => {
        const date = set.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { exercises: new Set<string>(), totalSets: 0 };
        }
        acc[date].exercises.add(set.exercise_name);
        acc[date].totalSets++;
        return acc;
      }, {} as Record<string, { exercises: Set<string>; totalSets: number }>);

      const workoutDays = Object.entries(grouped)
        .map(([date, data]) => ({
          date,
          exercises: Array.from(data.exercises),
          totalSets: data.totalSets
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

      setWorkouts(workoutDays);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs text-foreground/30">Loading...</p>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs text-foreground/30">No recent workouts</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {workouts.map((workout) => (
        <div 
          key={workout.date}
          className="flex items-center justify-between py-2 border-b border-foreground/5 last:border-0"
        >
          <div>
            <p className="text-xs text-foreground/50">
              {format(parseISO(workout.date), 'EEE, MMM d')}
            </p>
            <p className="text-xs text-foreground/30 mt-0.5">
              {workout.exercises.slice(0, 3).join(', ')}
              {workout.exercises.length > 3 && ` +${workout.exercises.length - 3}`}
            </p>
          </div>
          <span className="text-xs text-foreground/40 font-mono">
            {workout.totalSets} sets
          </span>
        </div>
      ))}
    </div>
  );
};

export default RecentWorkouts;
