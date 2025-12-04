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

export const useWeeklyRecommendations = (
  weekStart: string, 
  weekEnd: string, 
  sessions: DailySession[] | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['weekly-recommendations', weekStart, weekEnd],
    enabled: enabled && !!sessions,
    // TODO: legacy reference (weekly-recommendations), removed in consolidation
    queryFn: async (): Promise<Recommendation[]> => {
      if (!sessions || sessions.length === 0) {
        return [];
      }

      // const { data, error } = await supabase.functions.invoke('weekly-recommendations', {
      //   body: {
      //     weekStart,
      //     weekEnd,
      //     sessions
      //   }
      // });
      // if (error) {
      //   console.error('Error fetching recommendations:', error);
      //   throw error;
      // }
      const data = { recommendations: [] };

      const recommendations = data?.recommendations || [];

      // Auto-create smart notifications for scheduling recommendations
      if (recommendations.length > 0) {
        const weekDate = new Date(weekStart);
        const weekYear = weekDate.getFullYear();
        const weekNumber = Math.ceil(
          ((weekDate.getTime() - new Date(weekYear, 0, 1).getTime()) / 86400000 + 1) / 7
        );
        const weekIdentifier = `${weekYear}-W${weekNumber.toString().padStart(2, '0')}`;

        // Fire and forget - don't wait for this to complete
        supabase.functions
          .invoke('create-smart-notifications', {
            body: {
              recommendations,
              weekIdentifier
            }
          })
          .catch(err => console.error('Failed to create smart notifications:', err));
      }

      return recommendations;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
};
