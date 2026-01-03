import { useMemo } from 'react';
import { useTasks } from './useTasks';

interface FocusStatus {
  text: string;
  type: 'focus' | 'calendar' | 'inbox' | 'empty' | 'prompt';
}

/**
 * Generates a dynamic, context-aware focus status based on real data.
 * Priority: focus task → inbox state → today tasks → fallback prompt
 * 
 * Rules:
 * - ONE short sentence only
 * - No motivational language
 * - No affirmations or generic encouragement
 * - Must reflect CURRENT operational state
 */
export function useDynamicFocusStatus(): FocusStatus {
  const { tasks } = useTasks();
  
  return useMemo(() => {
    const taskList = tasks || [];
    
    // 1. Check for active focus task (highest priority)
    const focusTask = taskList.find(t => t.is_focus && !t.completed);
    if (focusTask) {
      // Truncate long titles for display
      const title = focusTask.title.length > 50 
        ? focusTask.title.substring(0, 47) + '...'
        : focusTask.title;
      return {
        text: `Today's focus: ${title}`,
        type: 'focus' as const,
      };
    }
    
    // 2. Check inbox count (heavy inbox = action needed)
    // Inbox tasks: no scheduled_bucket set OR category is 'inbox'
    const inboxTasks = taskList.filter(t => 
      !t.completed && 
      (!t.scheduled_bucket || t.category === 'inbox')
    );
    if (inboxTasks.length > 10) {
      return {
        text: 'Inbox is heavy. Pick a focus to start.',
        type: 'inbox' as const,
      };
    }
    
    // 3. Check today's tasks
    const todayTasks = taskList.filter(t => 
      t.scheduled_bucket === 'today' && !t.completed
    );
    
    if (todayTasks.length === 0) {
      // No tasks for today
      const anyIncompleteTasks = taskList.filter(t => !t.completed).length;
      if (anyIncompleteTasks === 0) {
        return {
          text: 'Nothing planned. Add something or rest.',
          type: 'empty' as const,
        };
      }
      return {
        text: 'No tasks for today. Pull something in or rest.',
        type: 'empty' as const,
      };
    }
    
    // 4. Has today tasks but no focus set
    if (todayTasks.length > 0) {
      return {
        text: "Pick one thing to anchor the day.",
        type: 'prompt' as const,
      };
    }
    
    // Fallback (shouldn't reach here often)
    return {
      text: "What's the one thing for today?",
      type: 'prompt' as const,
    };
  }, [tasks]);
}
