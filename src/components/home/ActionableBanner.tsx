import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionableItem {
  message: string;
  action: () => void;
}

export const ActionableBanner = () => {
  const [actionable, setActionable] = useState<ActionableItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActionableItems = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

        // Check for overdue tasks
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
            action: () => navigate(`/tasks`)
          });
          return;
        }

        // Check for tasks due in next 30 minutes
        const { data: upcomingTasks } = await supabase
          .from('tasks')
          .select('id, title, reminder_time')
          .eq('user_id', user.id)
          .eq('completed', false)
          .not('reminder_time', 'is', null)
          .gte('reminder_time', now.toISOString())
          .lt('reminder_time', thirtyMinutesFromNow.toISOString())
          .order('reminder_time', { ascending: true })
          .limit(1);

        if (upcomingTasks && upcomingTasks.length > 0) {
          const task = upcomingTasks[0];
          const minutesUntil = Math.round(
            (new Date(task.reminder_time!).getTime() - now.getTime()) / (1000 * 60)
          );
          setActionable({
            message: `${task.title} in ${minutesUntil} min`,
            action: () => navigate(`/tasks`)
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

        if (inboxCount && inboxCount > 5) {
          setActionable({
            message: `${inboxCount} items in inbox`,
            action: () => navigate('/inbox')
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

  return (
    <AnimatePresence>
      {actionable && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          onClick={actionable.action}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center cursor-pointer hover:opacity-80 transition-opacity"
        >
          <p className="text-sm text-muted-foreground/70">
            {actionable.message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
