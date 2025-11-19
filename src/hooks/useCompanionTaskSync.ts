import { useEffect, useRef, useCallback } from 'react';
import { CompanionEmotionHook } from './useCompanionEmotion';
import { CompanionMotionHook } from './useCompanionMotion';
import { CompanionGrowthHook } from './useCompanionGrowth';
import { LoreMomentsHook } from './useLoreMoments';

interface TaskEvent {
  type: 'created' | 'completed';
  timestamp: Date;
}

const RAPID_TASK_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const RAPID_TASK_THRESHOLD = 5; // 5 tasks in 2 minutes = overwhelmed
const MULTI_COMPLETION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PROUD_THRESHOLD = 3; // 3 completions in 10 minutes
const FIESTA_COMPLETION_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const FIESTA_THRESHOLD = 5; // 5 completions in 30 minutes
const INACTIVITY_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CompanionTaskSyncHook {
  onTaskCreated: () => void;
  onTaskCompleted: () => void;
  checkInactivity: () => void;
}

export const useCompanionTaskSync = (
  emotion: CompanionEmotionHook,
  motion: CompanionMotionHook,
  growth: CompanionGrowthHook,
  lore: LoreMomentsHook,
  personality: string
): CompanionTaskSyncHook => {
  const taskEventsRef = useRef<TaskEvent[]>([]);
  const lastActivityRef = useRef<Date>(new Date());
  const inactivityCheckedRef = useRef(false);

  // Clean up old events periodically
  const cleanupOldEvents = useCallback(() => {
    const now = Date.now();
    taskEventsRef.current = taskEventsRef.current.filter(
      event => now - event.timestamp.getTime() < FIESTA_COMPLETION_WINDOW_MS
    );
  }, []);

  // Check for inactivity on mount
  useEffect(() => {
    const checkInitialInactivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current.getTime();
      
      if (timeSinceLastActivity >= INACTIVITY_THRESHOLD_MS && !inactivityCheckedRef.current) {
        inactivityCheckedRef.current = true;
        emotion.setEmotion('sleepy');
        motion.triggerCalm();
        lore.triggerLore('inactivity');
      }
    };

    // Check after a short delay to allow other components to load
    const timeout = setTimeout(checkInitialInactivity, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const onTaskCreated = useCallback(() => {
    const now = new Date();
    lastActivityRef.current = now;
    inactivityCheckedRef.current = false;

    // Add event
    taskEventsRef.current.push({ type: 'created', timestamp: now });
    cleanupOldEvents();

    // Check for rapid task creation (overwhelmed state)
    const recentCreations = taskEventsRef.current.filter(
      event =>
        event.type === 'created' &&
        now.getTime() - event.timestamp.getTime() < RAPID_TASK_WINDOW_MS
    );

    if (recentCreations.length >= RAPID_TASK_THRESHOLD) {
      // User is overwhelmed
      emotion.setEmotion('overwhelmed');
      motion.triggerCalm();
    } else {
      // Normal focused state
      emotion.setEmotion('focused');
      motion.resetToIdle();
    }
  }, [emotion, motion, cleanupOldEvents]);

  const onTaskCompleted = useCallback(async () => {
    const now = new Date();
    lastActivityRef.current = now;
    inactivityCheckedRef.current = false;

    // Add event
    taskEventsRef.current.push({ type: 'completed', timestamp: now });
    cleanupOldEvents();

    // Award XP
    await growth.addXp(5, 'Task completed');

    // Micro-celebration wiggle
    motion.triggerCurious();

    // Check for multiple completions
    const recentCompletions = taskEventsRef.current.filter(
      event =>
        event.type === 'completed' &&
        now.getTime() - event.timestamp.getTime() < MULTI_COMPLETION_WINDOW_MS
    );

    const fiestaCompletions = taskEventsRef.current.filter(
      event =>
        event.type === 'completed' &&
        now.getTime() - event.timestamp.getTime() < FIESTA_COMPLETION_WINDOW_MS
    );

    if (fiestaCompletions.length >= FIESTA_THRESHOLD) {
      // 5 tasks in 30 minutes - Spark state even if Zen personality
      emotion.setEmotion('excited');
      motion.triggerFiesta();
      lore.triggerLore('growth');
    } else if (recentCompletions.length >= PROUD_THRESHOLD) {
      // 3 tasks in 10 minutes - Proud state
      emotion.setEmotion('proud');
      motion.triggerExcited();
    } else {
      // Single completion - brief encouraging state
      emotion.setEmotion('encouraging');
      
      // Return to neutral after a moment
      setTimeout(() => {
        emotion.setEmotion('neutral');
      }, 3000);
    }
  }, [emotion, motion, growth, lore, cleanupOldEvents]);

  const checkInactivity = useCallback(() => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current.getTime();
    
    if (timeSinceLastActivity >= INACTIVITY_THRESHOLD_MS && !inactivityCheckedRef.current) {
      inactivityCheckedRef.current = true;
      emotion.setEmotion('sleepy');
      motion.triggerCalm();
      lore.triggerLore('inactivity');
    }
  }, [emotion, motion, lore]);

  return {
    onTaskCreated,
    onTaskCompleted,
    checkInactivity,
  };
};
