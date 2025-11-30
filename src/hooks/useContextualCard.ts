import { useMemo } from 'react';
import { useTasks } from './useTasks';
import { useDailyMindstream } from './useDailyMindstream';

export interface ContextualCardData {
  title: string;
  subtitle: string;
  icon: 'inbox' | 'alert' | 'target' | 'check' | 'journal' | 'sparkles';
  action?: () => void;
  priority: number; // Higher = more important to show
}

/**
 * useContextualCard - Returns the most relevant card to show right now
 * 
 * Priority system:
 * 1. Overdue tasks (highest)
 * 2. Large inbox
 * 3. No "one thing" set in morning
 * 4. Quick wins available midday
 * 5. Evening reflection
 * 6. Default state (lowest)
 */
export function useContextualCard(): ContextualCardData {
  const { tasks } = useTasks();
  const mindstream = useDailyMindstream();
  
  const card = useMemo(() => {
    const hour = new Date().getHours();
    const now = new Date();
    
    // Count states
    const overdueTasks = tasks?.filter(t => 
      !t.completed && 
      t.reminder_time && 
      new Date(t.reminder_time) < now
    ) || [];
    
    const inboxTasks = tasks?.filter(t => 
      !t.completed && 
      !t.category && 
      !t.custom_category_id
    ) || [];
    
    const quickWins = tasks?.filter(t => 
      !t.completed && 
      t.effort === 'tiny'
    ) || [];
    
    const hasOneThing = !!mindstream.oneThingFocus;
    const todayDate = now.toISOString().split('T')[0];
    
    // Priority 1: Overdue tasks (critical)
    if (overdueTasks.length > 0) {
      return {
        title: `${overdueTasks.length} ${overdueTasks.length === 1 ? 'task' : 'tasks'} overdue`,
        subtitle: 'Tap to review',
        icon: 'alert' as const,
        action: () => {
          // Navigate to overdue view or show list
          window.location.hash = '#overdue';
        },
        priority: 100
      };
    }
    
    // Priority 2: Large inbox (needs attention)
    if (inboxTasks.length > 5) {
      return {
        title: `${inboxTasks.length} items in inbox`,
        subtitle: 'Tap to organize',
        icon: 'inbox' as const,
        action: () => {
          window.location.pathname = '/inbox';
        },
        priority: 90
      };
    }
    
    // Priority 3: Morning - set "one thing"
    if (!hasOneThing && hour >= 6 && hour < 12) {
      return {
        title: "What's your ONE thing today?",
        subtitle: 'Tap to choose your focus',
        icon: 'target' as const,
        action: () => {
          // Trigger daily priority prompt
          window.dispatchEvent(new CustomEvent('open-daily-priority'));
        },
        priority: 80
      };
    }
    
    // Priority 4: Midday - quick wins
    if (quickWins.length > 0 && hour >= 12 && hour < 17) {
      return {
        title: `${quickWins.length} quick ${quickWins.length === 1 ? 'win' : 'wins'} ready`,
        subtitle: 'Tap to knock them out',
        icon: 'check' as const,
        action: () => {
          window.location.pathname = '/tiny-task-fiesta';
        },
        priority: 70
      };
    }
    
    // Priority 5: Evening - reflection
    if (hour >= 18 && hour < 23) {
      return {
        title: 'How did today go?',
        subtitle: 'Tap to reflect and journal',
        icon: 'journal' as const,
        action: () => {
          window.location.pathname = '/journal';
        },
        priority: 60
      };
    }
    
    // Priority 6: Default - all clear
    return {
      title: 'All clear ✨',
      subtitle: 'Tap the orb below to capture',
      icon: 'sparkles' as const,
      action: undefined,
      priority: 0
    };
  }, [tasks, mindstream]);
  
  return card;
}
