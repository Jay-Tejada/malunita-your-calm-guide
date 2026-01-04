import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, format } from 'date-fns';

export interface WeeklyPrioritiesData {
  priorityOne: string | null;
  priorityTwo: string | null;
  priorityThree: string | null;
  weekStart: string;
}

export const useCurrentWeekPriorities = () => {
  return useQuery({
    queryKey: ['current-week-priorities'],
    queryFn: async (): Promise<WeeklyPrioritiesData | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('weekly_priorities')
        .select('priority_one, priority_two, priority_three, week_start')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .maybeSingle();

      if (error || !data) return null;

      return {
        priorityOne: data.priority_one,
        priorityTwo: data.priority_two,
        priorityThree: data.priority_three,
        weekStart: data.week_start,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
