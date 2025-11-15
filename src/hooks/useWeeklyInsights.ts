import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DailySession } from "./useDailySessions";
import { startOfWeek, endOfWeek, format } from "date-fns";

export interface Recommendation {
  type: "productivity" | "consistency" | "scheduling" | "reflection" | "focus" | "getting_started";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface WeeklyInsights {
  sessions: DailySession[];
  completionRate: number;
  totalSessions: number;
  completedSessions: number;
  topFocusThemes: Array<{ theme: string; count: number }>;
  deepWorkHours: number;
  reflectionRate: number;
  dayBreakdown: Array<{ date: string; hasSession: boolean; completed: boolean }>;
  focusConsistency: number;
  weekStart: string;
  weekEnd: string;
}

export const useWeeklyInsights = (weekOffset: number = 0) => {
  return useQuery({
    queryKey: ['weekly-insights', weekOffset],
    queryFn: async (): Promise<WeeklyInsights> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date();
      const targetWeek = new Date(today);
      targetWeek.setDate(today.getDate() + (weekOffset * 7));

      const weekStart = startOfWeek(targetWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(targetWeek, { weekStartsOn: 1 });

      const { data: sessions, error } = await supabase
        .from('daily_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;

      // Calculate insights
      const totalSessions = sessions?.length || 0;
      const completedSessions = sessions?.filter(s => 
        s.top_focus && (s.reflection_wins || s.reflection_improve)
      ).length || 0;
      
      const completionRate = totalSessions > 0 
        ? Math.round((completedSessions / totalSessions) * 100) 
        : 0;

      // Extract themes from top_focus
      const focusThemes: { [key: string]: number } = {};
      sessions?.forEach(s => {
        if (s.top_focus) {
          const words = s.top_focus.toLowerCase().split(' ')
            .filter(w => w.length > 4);
          words.forEach(word => {
            focusThemes[word] = (focusThemes[word] || 0) + 1;
          });
        }
      });

      const topFocusThemes = Object.entries(focusThemes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([theme, count]) => ({ theme, count }));

      // Calculate deep work hours
      let deepWorkHours = 0;
      sessions?.forEach(s => {
        if (s.deep_work_blocks && Array.isArray(s.deep_work_blocks)) {
          s.deep_work_blocks.forEach((block: any) => {
            if (block.start && block.end) {
              const start = new Date(`2000-01-01 ${block.start}`);
              const end = new Date(`2000-01-01 ${block.end}`);
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              deepWorkHours += hours;
            }
          });
        }
      });

      const reflectionRate = totalSessions > 0
        ? Math.round((sessions?.filter(s => s.reflection_wins || s.reflection_improve).length || 0) / totalSessions * 100)
        : 0;

      // Day breakdown
      const dayBreakdown = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const session = sessions?.find(s => s.date === dateStr);
        dayBreakdown.push({
          date: format(date, 'EEE'),
          hasSession: !!session,
          completed: !!(session?.top_focus && (session.reflection_wins || session.reflection_improve))
        });
      }

      const focusConsistency = totalSessions > 0
        ? Math.round((sessions?.filter(s => s.top_focus).length || 0) / 7 * 100)
        : 0;

      return {
        sessions: sessions as DailySession[],
        completionRate,
        totalSessions,
        completedSessions,
        topFocusThemes,
        deepWorkHours: Math.round(deepWorkHours * 10) / 10,
        reflectionRate,
        dayBreakdown,
        focusConsistency,
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd')
      };
    },
  });
};
