import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOneThingAvoidance = () => {
  const [hasCheckedToday, setHasCheckedToday] = useState(false);

  useEffect(() => {
    const checkAvoidance = async () => {
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();

      // Only check after 3 PM
      if (currentHour < 15) {
        return;
      }

      // Check if we've already triggered today
      const lastTriggered = localStorage.getItem('one-thing-avoidance-triggered');
      if (lastTriggered === today) {
        return;
      }

      if (hasCheckedToday) {
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get today's ONE thing
        const { data: primaryFocus } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_focus', true)
          .eq('focus_date', today)
          .single();

        // If no ONE thing or it's completed, don't trigger
        if (!primaryFocus || primaryFocus.completed) {
          return;
        }

        // Count completed tasks today (excluding the ONE thing)
        const { data: completedTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('completed_at', `${today}T00:00:00`)
          .lte('completed_at', `${today}T23:59:59`)
          .neq('id', primaryFocus.id);

        const completedCount = completedTasks?.length || 0;

        // Trigger if 3+ other tasks completed but ONE thing isn't
        if (completedCount >= 3) {
          console.log('ONE-thing avoidance detected:', {
            primaryFocus: primaryFocus.title,
            completedOtherTasks: completedCount
          });

          // Show concerned expression for 3 seconds
          window.dispatchEvent(new CustomEvent('companion:reaction', {
            detail: {
              expression: 'concerned_expression',
              duration: 3000
            }
          }));

          // Dispatch event for message
          window.dispatchEvent(new CustomEvent('companion:one-thing-avoidance', {
            detail: { taskTitle: primaryFocus.title }
          }));

          // Mark as triggered today
          localStorage.setItem('one-thing-avoidance-triggered', today);
          setHasCheckedToday(true);
        }
      } catch (error) {
        console.error('Error checking ONE-thing avoidance:', error);
      }
    };

    checkAvoidance();
  }, [hasCheckedToday]);

  const checkAfterTaskCompletion = () => {
    setHasCheckedToday(false);
  };

  return { checkAfterTaskCompletion };
};
