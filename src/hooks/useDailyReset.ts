import { useEffect } from 'react';
import { useEmotionalMemory } from '@/state/emotionalMemory';

/**
 * Hook to handle daily emotional memory reset at midnight
 */
export function useDailyReset() {
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      // Check if it's midnight (00:00)
      if (hour === 0 && minute === 0) {
        console.log('🌙 Midnight reset triggered');
        useEmotionalMemory.getState().dailyReset();
      }
    };

    // Check every minute
    const interval = setInterval(checkMidnight, 60 * 1000);

    // Check immediately on mount
    checkMidnight();

    return () => clearInterval(interval);
  }, []);
}
