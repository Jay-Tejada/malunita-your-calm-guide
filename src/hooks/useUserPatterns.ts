import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserPattern {
  id: string;
  user_id: string;
  pattern_type: string;
  pattern_data: any;
  updated_at: string;
}

/**
 * Fetch user patterns for intelligent companion messages
 */
export const useUserPatterns = () => {
  return useQuery({
    queryKey: ['user-patterns'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_patterns')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user patterns:', error);
        return null;
      }

      // Transform array into object keyed by pattern_type
      const patterns: Record<string, any> = {};
      data?.forEach((pattern: UserPattern) => {
        patterns[pattern.pattern_type] = pattern.pattern_data;
      });

      return patterns;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Get the most common hour for task completion
 */
export const getPeakCompletionHour = (patterns: Record<string, any> | null): number | null => {
  if (!patterns?.completion_hours?.hours) return null;

  const hours = patterns.completion_hours.hours;
  let maxCount = 0;
  let peakHour: number | null = null;

  Object.entries(hours).forEach(([hour, count]) => {
    if ((count as number) > maxCount) {
      maxCount = count as number;
      peakHour = parseInt(hour);
    }
  });

  return peakHour;
};
