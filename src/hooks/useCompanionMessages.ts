import { useState, useEffect, useRef } from 'react';
import { useTasksQuery } from './useTasksQuery';
import { useDebouncedValue } from './useDebounce';

interface CompanionMessage {
  text: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useCompanionMessages = () => {
  const { tasks } = useTasksQuery();
  // Debounce tasks to avoid excessive recalculations
  const debouncedTasks = useDebouncedValue(tasks, 500);
  const [currentMessage, setCurrentMessage] = useState<CompanionMessage | null>(null);
  const lastActivityTime = useRef(Date.now());
  const tasksCompletedThisSession = useRef(0);
  const lastCompletedCount = useRef(0);
  const lastEncouragementTime = useRef(Date.now());

  // Check if dismissed for 1 hour
  const isDismissed = () => {
    const dismissedUntil = localStorage.getItem('companion_dismissed_until');
    if (dismissedUntil) {
      return Date.now() < parseInt(dismissedUntil);
    }
    return false;
  };

  // Update activity time
  const updateActivity = () => {
    lastActivityTime.current = Date.now();
  };

  // Track task completions (use non-debounced tasks for immediate feedback on completions)
  useEffect(() => {
    if (!tasks) return;

    const completedCount = tasks.filter(t => t.completed).length;
    
    // Check if new tasks were completed
    if (completedCount > lastCompletedCount.current) {
      const newCompletions = completedCount - lastCompletedCount.current;
      tasksCompletedThisSession.current += newCompletions;
      updateActivity();

      // Check if it was the ONE thing (primary focus)
      const recentlyCompleted = tasks.find(t => 
        t.completed && 
        t.is_focus && 
        t.completed_at && 
        Date.now() - new Date(t.completed_at).getTime() < 5000
      );

      if (recentlyCompleted && !isDismissed()) {
        setCurrentMessage({
          text: "Nice! That was your priority ✨",
        });
      }
      // Check for streak (3+ completions)
      else if (tasksCompletedThisSession.current >= 3 && !isDismissed()) {
        setCurrentMessage({
          text: "You're on a roll! 🔥",
        });
        tasksCompletedThisSession.current = 0; // Reset to avoid spam
      }
    }

    lastCompletedCount.current = completedCount;
  }, [tasks]);

  // Check inbox size (use debounced tasks for non-urgent checks)
  useEffect(() => {
    if (!debouncedTasks || isDismissed()) return;

    const inboxTasks = debouncedTasks.filter(t => 
      !t.completed && 
      t.category === 'inbox'
    );

    if (inboxTasks.length > 10) {
      // Only show once per hour
      const lastInboxCheck = localStorage.getItem('last_inbox_message');
      const shouldShow = !lastInboxCheck || 
        Date.now() - parseInt(lastInboxCheck) > 60 * 60 * 1000;

      if (shouldShow) {
        setCurrentMessage({
          text: "Want help cleaning up your inbox?",
          action: {
            label: "Clean up",
            onClick: () => {
              // Navigate to inbox or trigger cleanup
              window.location.href = '/inbox';
            },
          },
        });
        localStorage.setItem('last_inbox_message', Date.now().toString());
      }
    }
  }, [debouncedTasks]);

  // Inactivity check (10 minutes)
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityTime.current;
      
      // 10 minutes of inactivity
      if (inactiveTime > 10 * 60 * 1000 && !isDismissed()) {
        setCurrentMessage({
          text: "Still there? Take a quick break if you need! ☕",
        });
        updateActivity(); // Reset to avoid spam
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(checkInactivity);
  }, []);

  // Random encouragement (every 30 minutes)
  useEffect(() => {
    const showEncouragement = () => {
      const timeSinceLastEncouragement = Date.now() - lastEncouragementTime.current;
      
      if (timeSinceLastEncouragement > 30 * 60 * 1000 && !isDismissed()) {
        const encouragements = [
          "You've got this! 💪",
          "Making progress, one step at a time 🌟",
          "Remember to celebrate small wins! 🎉",
          "Proud of you for showing up today ✨",
          "Taking action is what matters most 🚀",
        ];
        
        const randomMessage = encouragements[Math.floor(Math.random() * encouragements.length)];
        setCurrentMessage({ text: randomMessage });
        lastEncouragementTime.current = Date.now();
      }
    };

    const timer = setInterval(showEncouragement, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(timer);
  }, []);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => updateActivity();
    
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  const dismissMessage = () => {
    setCurrentMessage(null);
  };

  return {
    message: currentMessage?.text,
    action: currentMessage?.action,
    dismissMessage,
  };
};
