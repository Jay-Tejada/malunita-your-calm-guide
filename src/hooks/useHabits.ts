import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, isToday } from 'date-fns';

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'weekdays';
  target_count: number;
  icon: string | null;
  color: string | null;
  created_at: string;
  archived: boolean;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  date: string;
}

export function useHabits() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all active habits
  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Habit[];
    },
  });

  // Fetch completions for the last 7 days
  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: ['habit_completions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo);

      if (error) throw error;
      return data as HabitCompletion[];
    },
  });

  // Create habit mutation
  const createHabit = useMutation({
    mutationFn: async (habit: Partial<Habit>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          title: habit.title,
          frequency: habit.frequency || 'daily',
          target_count: habit.target_count || 1,
          icon: habit.icon,
          color: habit.color,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({ title: 'Habit created' });
    },
    onError: (error) => {
      console.error('Error creating habit:', error);
      toast({ title: 'Failed to create habit', variant: 'destructive' });
    },
  });

  // Toggle habit completion
  const toggleCompletion = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const targetDate = date || format(new Date(), 'yyyy-MM-dd');

      // Check if already completed today
      const existing = completions?.find(
        c => c.habit_id === habitId && c.date === targetDate
      );

      if (existing) {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'uncompleted' };
      } else {
        // Add completion
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            date: targetDate,
          });
        if (error) throw error;
        return { action: 'completed' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit_completions'] });
    },
    onError: (error) => {
      console.error('Error toggling habit:', error);
      toast({ title: 'Failed to update habit', variant: 'destructive' });
    },
  });

  // Archive habit
  const archiveHabit = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from('habits')
        .update({ archived: true })
        .eq('id', habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({ title: 'Habit archived' });
    },
  });

  // Calculate streak for a habit
  const getStreak = (habitId: string): number => {
    if (!completions) return 0;

    const habitCompletions = completions
      .filter(c => c.habit_id === habitId)
      .map(c => c.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (habitCompletions.length === 0) return 0;

    let streak = 0;
    let currentDate = startOfDay(new Date());

    // Check if completed today
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    if (!habitCompletions.includes(todayStr)) {
      // Check if completed yesterday (streak can still be active)
      currentDate = subDays(currentDate, 1);
    }

    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      if (habitCompletions.includes(dateStr)) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Check if habit is completed today
  const isCompletedToday = (habitId: string): boolean => {
    if (!completions) return false;
    const today = format(new Date(), 'yyyy-MM-dd');
    return completions.some(c => c.habit_id === habitId && c.date === today);
  };

  // Get completion status for last 7 days
  const getWeekCompletions = (habitId: string): boolean[] => {
    const result: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const completed = completions?.some(c => c.habit_id === habitId && c.date === date) || false;
      result.push(completed);
    }
    return result;
  };

  return {
    habits: habits || [],
    completions: completions || [],
    isLoading: habitsLoading || completionsLoading,
    createHabit,
    toggleCompletion,
    archiveHabit,
    getStreak,
    isCompletedToday,
    getWeekCompletions,
  };
}
