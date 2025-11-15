import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Recommendation } from "./useWeeklyInsights";
import { DailySession } from "./useDailySessions";

export const useWeeklyRecommendations = (
  weekStart: string, 
  weekEnd: string, 
  sessions: DailySession[] | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['weekly-recommendations', weekStart, weekEnd],
    enabled: enabled && !!sessions,
    queryFn: async (): Promise<Recommendation[]> => {
      if (!sessions || sessions.length === 0) {
        return [];
      }

      const { data, error } = await supabase.functions.invoke('weekly-recommendations', {
        body: {
          weekStart,
          weekEnd,
          sessions
        }
      });

      if (error) {
        console.error('Error fetching recommendations:', error);
        throw error;
      }

      return data?.recommendations || [];
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
};
