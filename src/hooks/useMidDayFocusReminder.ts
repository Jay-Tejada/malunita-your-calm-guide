import { useState, useEffect } from 'react';
import { useTasks } from './useTasks';
import { format } from 'date-fns';

interface MidDayReminderState {
  showReminder: boolean;
  focusTask: any | null;
}

const REMINDER_HOUR = 13; // 1:00 PM
const REMINDER_WINDOW_MINUTES = 30; // Show for 30 minutes

export const useMidDayFocusReminder = () => {
  const { tasks } = useTasks();
  const [reminderState, setReminderState] = useState<MidDayReminderState>({
    showReminder: false,
    focusTask: null,
  });

  useEffect(() => {
    const checkReminder = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const today = format(now, 'yyyy-MM-dd');

      // Check if we're in the reminder window (1:00 PM - 1:30 PM)
      const inReminderWindow = 
        currentHour === REMINDER_HOUR && 
        currentMinute < REMINDER_WINDOW_MINUTES;

      if (!inReminderWindow) {
        setReminderState({ showReminder: false, focusTask: null });
        return;
      }

      // Check if we've already shown the reminder today
      const lastShown = localStorage.getItem('midday-reminder-shown');
      if (lastShown === today) {
        setReminderState({ showReminder: false, focusTask: null });
        return;
      }

      // Find today's focus task
      const todaysFocusTask = tasks?.find(
        task => task.is_focus && task.focus_date === today && !task.completed
      );

      if (todaysFocusTask) {
        setReminderState({
          showReminder: true,
          focusTask: todaysFocusTask,
        });
      } else {
        setReminderState({ showReminder: false, focusTask: null });
      }
    };

    // Check immediately
    checkReminder();

    // Check every minute
    const interval = setInterval(checkReminder, 60000);

    return () => clearInterval(interval);
  }, [tasks]);

  const dismissReminder = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem('midday-reminder-shown', today);
    setReminderState({ showReminder: false, focusTask: null });
  };

  return {
    showReminder: reminderState.showReminder,
    focusTask: reminderState.focusTask,
    dismissReminder,
  };
};
