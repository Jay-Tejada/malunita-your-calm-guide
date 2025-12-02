import { useMemo, useEffect, useState, useRef } from 'react';
import { useTasks } from './useTasks';
import { useUserPatterns, getPeakCompletionHour } from './useUserPatterns';
import { useProgressStats } from './useProgressStats';
import { generateFlowSessions, FlowSession } from '@/utils/taskCategorizer';
import { useDebouncedValue } from './useDebounce';

export interface CompanionMessage {
  text: string;
  type: 'greeting' | 'insight' | 'nudge' | 'celebration' | 'reflection';
  action?: {
    type: 'start_session';
    session: FlowSession;
  };
}

export const useCompanionMessage = (): CompanionMessage | null => {
  const { tasks } = useTasks();
  const { data: patterns } = useUserPatterns();
  const { completedToday: progressCompletedToday, streak } = useProgressStats();
  const [personalBest, setPersonalBest] = useState(() => {
    return parseInt(localStorage.getItem('malunita_best_day') || '0');
  });
  
  // Debounce tasks to avoid expensive recalculations on every change
  const debouncedTasks = useDebouncedValue(tasks, 1000);
  
  // Cache flow sessions to avoid regenerating on every render
  const [cachedFlowSessions, setCachedFlowSessions] = useState<FlowSession[]>([]);
  const lastFlowSessionUpdate = useRef<number>(0);
  
  // Check for daily high score and update
  useEffect(() => {
    if (progressCompletedToday > personalBest && progressCompletedToday >= 5) {
      localStorage.setItem('malunita_best_day', progressCompletedToday.toString());
      setPersonalBest(progressCompletedToday);
    }
  }, [progressCompletedToday, personalBest]);
  
  // Generate flow sessions with debouncing (expensive operation)
  useEffect(() => {
    const now = Date.now();
    // Only regenerate if 2 seconds have passed since last update
    if (now - lastFlowSessionUpdate.current < 2000) return;
    
    if (debouncedTasks) {
      const todayTasks = debouncedTasks.filter(t => t.scheduled_bucket === 'today' && !t.completed);
      const sessions = generateFlowSessions(todayTasks);
      setCachedFlowSessions(sessions);
      lastFlowSessionUpdate.current = now;
    }
  }, [debouncedTasks]);
  
  return useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    
    // Use debounced tasks for expensive calculations
    const taskList = debouncedTasks || [];
    
    // Task stats
    const todayTasks = taskList.filter(t => t.scheduled_bucket === 'today');
    const completedToday = todayTasks.filter(t => t.completed).length;
    const remainingToday = todayTasks.filter(t => !t.completed).length;
    const inboxCount = taskList.filter(t => (t.category === 'inbox' || !t.category) && !t.completed).length;
    
    // Total completed all-time
    const totalCompleted = taskList.filter(t => t.completed).length;
    
    // Work pattern detection
    const workTasksToday = todayTasks.filter(t => t.category === 'work' && !t.completed).length;
    const personalTasksToday = todayTasks.filter(t => t.category !== 'work' && !t.completed).length;
    
    // Focus task awareness
    const focusTask = taskList.find(t => t.is_focus && !t.completed);
    
    // Completion velocity
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentCompletions = taskList.filter(t => 
      t.completed && 
      t.completed_at && 
      new Date(t.completed_at) > oneHourAgo
    ).length;
    
    // Find neglected tasks (in inbox > 7 days)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const neglectedTasks = taskList.filter(t => 
      !t.completed && 
      (t.category === 'inbox' || !t.category) &&
      new Date(t.created_at) < oneWeekAgo
    );
    
    // Priority message selection (first match wins)
    
    // 0. MILESTONE CELEBRATIONS (highest priority — rare & meaningful)
    
    // Streak milestones
    if (streak === 7) {
      return {
        text: "One week streak. You're building a habit.",
        type: 'celebration'
      };
    }
    if (streak === 30) {
      return {
        text: "30 days. This is who you are now.",
        type: 'celebration'
      };
    }
    if (streak === 100) {
      return {
        text: "100 days. Incredible.",
        type: 'celebration'
      };
    }
    
    // Total completion milestones
    if (totalCompleted === 10) {
      return {
        text: "10 tasks done. You're getting the hang of this.",
        type: 'celebration'
      };
    }
    if (totalCompleted === 100) {
      return {
        text: "100 tasks completed. Look at you go.",
        type: 'celebration'
      };
    }
    if (totalCompleted === 500) {
      return {
        text: "500 done. You've built something real.",
        type: 'celebration'
      };
    }
    
    // Daily high score (only if improved and >= 5)
    if (completedToday > personalBest && completedToday >= 5) {
      return {
        text: `New personal best. ${completedToday} in one day.`,
        type: 'celebration'
      };
    }
    
    // 1. CELEBRATIONS (reward good behavior)
    if (completedToday >= 5) {
      return { 
        text: "You're on fire today. 5 tasks crushed.", 
        type: 'celebration' 
      };
    }
    if (completedToday >= 3) {
      return { 
        text: "Solid momentum. Keep going.", 
        type: 'celebration' 
      };
    }
    
    // 2. COMPLETION VELOCITY (acknowledge fast work)
    if (recentCompletions >= 3) {
      return { 
        text: "You're in the zone. Keep that energy.", 
        type: 'celebration' 
      };
    }
    
    // 3. TIME-BASED GREETINGS
    
    // If focus is already set, acknowledge it
    if (focusTask && hour >= 5 && hour < 12) {
      const focusMessages = [
        "Focus is set. You know what to do.",
        "Eyes on the prize.",
        "One thing at a time.",
        "Stay locked in.",
      ];
      return {
        text: focusMessages[Math.floor(Math.random() * focusMessages.length)],
        type: 'greeting'
      };
    }
    
    // Only show "What's the ONE thing" if NO focus is set
    if (!focusTask && hour >= 5 && hour < 11) {
      return {
        text: "Morning. What's the ONE thing for today?",
        type: 'greeting'
      };
    }
    
    if (hour >= 5 && hour < 9) {
      // Early morning
      const morningMessages = [
        "Fresh start. What matters most today?",
        "Morning. Let's make today count.",
        "New day, clean slate.",
      ];
      return { 
        text: morningMessages[Math.floor(Math.random() * morningMessages.length)], 
        type: 'greeting' 
      };
    }
    
    if (hour >= 9 && hour < 12) {
      // Mid-morning
      if (remainingToday > 0 && completedToday === 0) {
        return { 
          text: "Ready when you are.", 
          type: 'greeting' 
        };
      }
    }
    
    if (hour >= 12 && hour < 14) {
      // Midday
      if (completedToday > 0) {
        return { 
          text: `${completedToday} down. Good pace.`, 
          type: 'insight' 
        };
      }
    }
    
    // 4. FOCUS TASK AWARENESS (during work hours)
    if (focusTask && hour >= 10 && hour < 17) {
      return { 
        text: `Still focused on "${focusTask.title.slice(0, 25)}${focusTask.title.length > 25 ? '...' : ''}"?`, 
        type: 'nudge' 
      };
    }
    
    // 4.5. PATTERN-BASED POWER HOUR DETECTION
    const peakHour = getPeakCompletionHour(patterns);
    if (peakHour !== null && hour === peakHour && completedToday === 0 && remainingToday > 0) {
      return {
        text: "This is usually your power hour. Ready?",
        type: 'nudge'
      };
    }
    
    // 4.6. FLOW SESSION NUDGES (use cached sessions)
    const flowSessions = cachedFlowSessions;
    
    if (flowSessions.length > 0) {
      const bestSession = flowSessions[0];
      
      if (bestSession.type === 'tiny_task_fiesta' && bestSession.tasks.length >= 4) {
        return {
          text: `${bestSession.tasks.length} tiny tasks waiting. 10 minutes could clear them all.`,
          type: 'nudge',
          action: { type: 'start_session', session: bestSession },
        };
      }
      
      if (bestSession.type === 'avoidance_buster') {
        return {
          text: `Some tasks have been waiting. Want to tackle them together?`,
          type: 'nudge',
          action: { type: 'start_session', session: bestSession },
        };
      }
    }
    
    // 5. ENCOURAGEMENT FOR SLOW DAYS
    if (hour >= 14 && completedToday === 0 && remainingToday > 0) {
      const gentleNudges = [
        "Slow day? That's okay. One small thing.",
        "Start with the smallest task. Momentum builds.",
        "Even 5 minutes counts.",
      ];
      return {
        text: gentleNudges[Math.floor(Math.random() * gentleNudges.length)],
        type: 'nudge'
      };
    }
    
    if (hour >= 17 && hour < 20) {
      // Evening
      if (remainingToday > 0) {
        return { 
          text: `${remainingToday} left for today. You got this.`, 
          type: 'nudge' 
        };
      }
      if (completedToday > 0) {
        return { 
          text: "Wrapping up. Nice work today.", 
          type: 'reflection' 
        };
      }
    }
    
    if (hour >= 20 || hour < 5) {
      // Night
      const nightMessages = [
        "Rest well. Tomorrow's a new day.",
        "Quiet hours. Time to recharge.",
        "The day is done. Be proud of what you did.",
      ];
      return { 
        text: nightMessages[Math.floor(Math.random() * nightMessages.length)], 
        type: 'reflection' 
      };
    }
    
    // 6. WORK PATTERN DETECTION (work-life balance insight)
    if (workTasksToday > 3 && personalTasksToday === 0) {
      return { 
        text: "All work today. Don't forget to live a little.", 
        type: 'insight' 
      };
    }
    
    // 7. NUDGES (gentle reminders)
    if (neglectedTasks.length > 0) {
      const oldestTask = neglectedTasks[0];
      const daysOld = Math.floor((now.getTime() - new Date(oldestTask.created_at).getTime()) / (24 * 60 * 60 * 1000));
      return { 
        text: `"${oldestTask.title.slice(0, 30)}${oldestTask.title.length > 30 ? '...' : ''}" has been waiting ${daysOld} days.`, 
        type: 'nudge' 
      };
    }
    
    if (inboxCount > 5) {
      return { 
        text: `${inboxCount} thoughts in your inbox. Want to process them?`, 
        type: 'nudge' 
      };
    }
    
    // 8. DAY-SPECIFIC
    if (dayOfWeek === 1) { // Monday
      return { 
        text: "New week. What would make this one great?", 
        type: 'greeting' 
      };
    }
    if (dayOfWeek === 5) { // Friday
      return { 
        text: "Friday. Finish strong, then rest.", 
        type: 'greeting' 
      };
    }
    
    // 9. DEFAULT INSIGHTS
    if (remainingToday > 0) {
      return { 
        text: `${remainingToday} thing${remainingToday > 1 ? 's' : ''} on your plate.`, 
        type: 'insight' 
      };
    }
    
    // 10. RANDOM WISDOM (low priority, sprinkle in occasionally)
    const wisdomMessages = [
      "Done is better than perfect.",
      "What would make this easier?",
      "You don't have to do everything today.",
      "Progress, not perfection.",
      "Breathe. Then begin.",
    ];
    
    // 10% chance to show wisdom instead of default
    if (Math.random() < 0.1) {
      return {
      text: wisdomMessages[Math.floor(Math.random() * wisdomMessages.length)],
      type: 'insight'
    };
  }
  
  // 11. FALLBACK — all clear
  return { 
    text: "All clear. What's on your mind?", 
    type: 'greeting' 
  };
  
}, [debouncedTasks, patterns, streak, personalBest, progressCompletedToday, cachedFlowSessions]);
};
