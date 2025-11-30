import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface ActionableBannerData {
  message: string;
  action: () => void;
  type: 'inbox' | 'overdue' | 'upcoming';
}

/**
 * useActionableBanner - Returns the most urgent actionable item to display
 * 
 * Priority order:
 * 1. Overdue tasks (highest urgency)
 * 2. Tasks due within 2 hours
 * 3. Inbox items needing review
 * 
 * Returns null if nothing actionable
 */
export function useActionableBanner(): ActionableBannerData | null {
  const [actionable, setActionable] = useState<ActionableBannerData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActionableItems = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setActionable(null);
          return;
        }

        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        // Check for overdue tasks (highest priority)
        const { data: overdueTasks } = await supabase
          .from('tasks')
          .select('id, title')
          .eq('user_id', user.id)
          .eq('completed', false)
          .not('reminder_time', 'is', null)
          .lt('reminder_time', now.toISOString())
          .limit(1);

        if (overdueTasks && overdueTasks.length > 0) {
          const task = overdueTasks[0];
          setActionable({
            message: `${task.title} is overdue`,
            action: () => navigate('/tasks'),
            type: 'overdue'
          });
          return;
        }

        // Check for tasks due within 2 hours
        const { data: upcomingTasks } = await supabase
          .from('tasks')
          .select('id, title, reminder_time')
          .eq('user_id', user.id)
          .eq('completed', false)
          .not('reminder_time', 'is', null)
          .gte('reminder_time', now.toISOString())
          .lt('reminder_time', twoHoursFromNow.toISOString())
          .order('reminder_time', { ascending: true })
          .limit(1);

        if (upcomingTasks && upcomingTasks.length > 0) {
          const task = upcomingTasks[0];
          const minutesUntil = Math.round(
            (new Date(task.reminder_time!).getTime() - now.getTime()) / (1000 * 60)
          );
          setActionable({
            message: `${task.title} in ${minutesUntil} min`,
            action: () => navigate('/tasks'),
            type: 'upcoming'
          });
          return;
        }

        // Check for inbox items
        const { count: inboxCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('completed', false)
          .is('category', null)
          .is('custom_category_id', null);

        if (inboxCount && inboxCount > 0) {
          setActionable({
            message: `${inboxCount} ${inboxCount === 1 ? 'item' : 'items'} in inbox`,
            action: () => navigate('/inbox'),
            type: 'inbox'
          });
          return;
        }

        // Nothing actionable
        setActionable(null);

      } catch (error) {
        console.error('Error fetching actionable items:', error);
        setActionable(null);
      }
    };

    fetchActionableItems();

    // Refresh every 2 minutes
    const interval = setInterval(fetchActionableItems, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  return actionable;
}
