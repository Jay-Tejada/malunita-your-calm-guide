import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, parseISO, startOfDay, isAfter } from 'date-fns';

interface FocusTrendData {
  date: string;
  outcome: 'done' | 'partial' | 'missed' | null;
  focusTask: string;
}

export const useFocusTrends = () => {
  return useQuery({
    queryKey: ['focus-trends'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get last 7 days of focus history
      const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('daily_focus_history')
        .select('date, outcome, focus_task')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo)
        .lte('date', today)
        .order('date', { ascending: true });

      if (error) throw error;

      // Create a map of existing data
      const dataMap = new Map(data?.map(d => [d.date, d]) || []);

      // Generate all 7 days, filling in nulls for missing days
      const trends: FocusTrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const dayData = dataMap.get(date);
        
        trends.push({
          date: format(parseISO(date), 'EEE'),
          outcome: dayData?.outcome as 'done' | 'partial' | 'missed' | null || null,
          focusTask: dayData?.focus_task || '',
        });
      }

      // Calculate streak based on consecutive "done" outcomes
      let currentStreak = 0;
      for (let i = trends.length - 1; i >= 0; i--) {
        if (trends[i].outcome === 'done') {
          currentStreak++;
        } else if (trends[i].outcome !== null) {
          // Only break streak if there's an actual outcome (not a missing day)
          break;
        }
      }

      return {
        trends,
        currentStreak,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
