import { useState, useEffect } from 'react';
import { useTasks } from './useTasks';
import { format } from 'date-fns';

interface WrapUpState {
  showWrapUp: boolean;
  completed: boolean;
  focusTask: any | null;
}

const WRAPUP_HOUR = 20; // 8:00 PM

export const useEndOfDayWrapUp = () => {
  const { tasks } = useTasks();
  const [wrapUpState, setWrapUpState] = useState<WrapUpState>({
    showWrapUp: false,
    completed: false,
    focusTask: null,
  });

  useEffect(() => {
    const checkWrapUp = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const today = format(now, 'yyyy-MM-dd');

      // Hide if it's past midnight (new day)
      const lastShownDate = localStorage.getItem('wrapup-shown-date');
      if (lastShownDate && lastShownDate !== today) {
        localStorage.removeItem('wrapup-shown-date');
        setWrapUpState({ showWrapUp: false, completed: false, focusTask: null });
        return;
      }

      // Check if we're at or past 8 PM
      if (currentHour < WRAPUP_HOUR) {
        setWrapUpState({ showWrapUp: false, completed: false, focusTask: null });
        return;
      }

      // Check if we've already shown it today
      if (lastShownDate === today) {
        // Still show it if it was shown today (until midnight)
        const todaysFocusTask = tasks?.find(
          task => task.is_focus && task.focus_date === today
        );
        
        if (todaysFocusTask) {
          setWrapUpState({
            showWrapUp: true,
            completed: todaysFocusTask.completed,
            focusTask: todaysFocusTask,
          });
        }
        return;
      }

      // Find today's focus task
      const todaysFocusTask = tasks?.find(
        task => task.is_focus && task.focus_date === today
      );

      if (todaysFocusTask) {
        localStorage.setItem('wrapup-shown-date', today);
        setWrapUpState({
          showWrapUp: true,
          completed: todaysFocusTask.completed,
          focusTask: todaysFocusTask,
        });
      } else {
        setWrapUpState({ showWrapUp: false, completed: false, focusTask: null });
      }
    };

    // Check immediately
    checkWrapUp();

    // Check every minute
    const interval = setInterval(checkWrapUp, 60000);

    return () => clearInterval(interval);
  }, [tasks]);

  const dismiss = () => {
    setWrapUpState({ showWrapUp: false, completed: false, focusTask: null });
  };

  return {
    showWrapUp: wrapUpState.showWrapUp,
    completed: wrapUpState.completed,
    focusTask: wrapUpState.focusTask,
    dismiss,
  };
};
