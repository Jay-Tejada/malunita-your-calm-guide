import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Task Streak Detection
 * Detects when 2+ tasks are completed within 10 minutes
 */

interface TaskCompletion {
  timestamp: number;
  taskId: string;
}

const STREAK_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MIN_STREAK_COUNT = 2;

export function useTaskStreak() {
  const [streakCount, setStreakCount] = useState(0);
  const [isStreakActive, setIsStreakActive] = useState(false);
  const completionsRef = useRef<TaskCompletion[]>([]);
  const streakTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up old completions outside the window
  const cleanupOldCompletions = useCallback(() => {
    const now = Date.now();
    completionsRef.current = completionsRef.current.filter(
      (completion) => now - completion.timestamp < STREAK_WINDOW_MS
    );
  }, []);

  // Register a task completion
  const registerCompletion = useCallback((taskId: string) => {
    cleanupOldCompletions();
    
    const now = Date.now();
    completionsRef.current.push({ timestamp: now, taskId });
    
    const currentCount = completionsRef.current.length;
    setStreakCount(currentCount);
    
    // Check if we have a streak
    if (currentCount >= MIN_STREAK_COUNT) {
      setIsStreakActive(true);
      
      // Clear previous timeout
      if (streakTimeoutRef.current) {
        clearTimeout(streakTimeoutRef.current);
      }
      
      // Set timeout to reset streak after window
      streakTimeoutRef.current = setTimeout(() => {
        setIsStreakActive(false);
        setStreakCount(0);
        completionsRef.current = [];
      }, STREAK_WINDOW_MS);
      
      return currentCount;
    }
    
    return 1;
  }, [cleanupOldCompletions]);

  // Reset streak manually
  const resetStreak = useCallback(() => {
    if (streakTimeoutRef.current) {
      clearTimeout(streakTimeoutRef.current);
    }
    setIsStreakActive(false);
    setStreakCount(0);
    completionsRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streakTimeoutRef.current) {
        clearTimeout(streakTimeoutRef.current);
      }
    };
  }, []);

  return {
    streakCount,
    isStreakActive,
    registerCompletion,
    resetStreak,
  };
}
