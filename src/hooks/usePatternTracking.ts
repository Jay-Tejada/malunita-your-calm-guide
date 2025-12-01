import { supabase } from '@/integrations/supabase/client';

/**
 * Track user patterns for companion intelligence
 */
export const usePatternTracking = () => {
  const trackTaskCompletion = async (userId: string, task: any) => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    try {
      // Track completion hours pattern
      await supabase.rpc('update_user_pattern', {
        p_user_id: userId,
        p_pattern_type: 'completion_hours',
        p_data: { hour: hour.toString(), dayOfWeek }
      });

      // Track category patterns if available
      if (task.category) {
        await supabase.rpc('update_user_pattern', {
          p_user_id: userId,
          p_pattern_type: 'common_categories',
          p_data: { [task.category]: 1 }
        });
      }
    } catch (error) {
      console.error('Error tracking pattern:', error);
    }
  };

  return {
    trackTaskCompletion
  };
};
