import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useTasks } from './useTasks';

/**
 * Hook to check and trigger auto-focus at 11 AM if user hasn't selected ONE thing
 */
export const useAutoFocus = () => {
  const { profile, isLoading: profileLoading } = useProfile();
  const { tasks } = useTasks();
  const [autoFocusTriggered, setAutoFocusTriggered] = useState(false);
  const [autoFocusTask, setAutoFocusTask] = useState<any>(null);

  useEffect(() => {
    if (profileLoading || !profile) return;
    const autoFocusEnabled = (profile as any).auto_focus_enabled;
    if (!autoFocusEnabled) return;

    const checkAutoFocus = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const today = now.toISOString().split('T')[0];

      // Only check between 11:00 AM and 11:59 AM
      if (currentHour !== 11) return;

      // Check if user already has a ONE thing for today
      const hasFocus = tasks?.some(
        task => task.is_focus && task.focus_date === today && !task.completed
      );

      if (hasFocus) {
        console.log('✅ User already has ONE thing for today');
        return;
      }

      // Check if auto-focus already triggered today
      const lastTriggered = localStorage.getItem('autoFocusLastTriggered');
      if (lastTriggered === today) {
        console.log('✅ Auto-focus already triggered today');
        return;
      }

      console.log('🤖 Triggering auto-focus check...');

      try {
        const { data, error } = await supabase.functions.invoke('auto-focus-check', {
          body: {},
        });

        if (error) throw error;

        if (data?.task) {
          console.log('✨ Auto-focus set:', data.task);
          setAutoFocusTriggered(true);
          setAutoFocusTask(data.task);
          localStorage.setItem('autoFocusLastTriggered', today);
        }
      } catch (error) {
        console.error('Failed to trigger auto-focus:', error);
      }
    };

    // Check immediately if in the 11 AM hour
    checkAutoFocus();

    // Set up interval to check every 5 minutes during the 11 AM hour
    const interval = setInterval(checkAutoFocus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [profile, tasks, profileLoading]);

  if (profileLoading || !profile) {
    return {
      autoFocusTriggered: false,
      autoFocusTask: null,
      clearAutoFocusMessage: () => {},
    };
  }

  return {
    autoFocusTriggered,
    autoFocusTask,
    clearAutoFocusMessage: () => {
      setAutoFocusTriggered(false);
      setAutoFocusTask(null);
    },
  };
};
