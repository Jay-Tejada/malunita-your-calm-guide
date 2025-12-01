import { useMemo } from 'react';
import { useTasks } from './useTasks';

interface CompanionMessage {
  text: string;
  type: 'greeting' | 'insight' | 'nudge' | 'celebration' | 'reflection';
}

export const useCompanionMessage = (): CompanionMessage | null => {
  const { tasks } = useTasks();
  
  return useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    
    // Task stats
    const todayTasks = tasks?.filter(t => t.scheduled_bucket === 'today') || [];
    const completedToday = todayTasks.filter(t => t.completed).length;
    const remainingToday = todayTasks.filter(t => !t.completed).length;
    const inboxCount = tasks?.filter(t => (t.category === 'inbox' || !t.category) && !t.completed).length || 0;
    
    // Find neglected tasks (in inbox > 7 days)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const neglectedTasks = tasks?.filter(t => 
      !t.completed && 
      (t.category === 'inbox' || !t.category) &&
      new Date(t.created_at) < oneWeekAgo
    ) || [];
    
    // Find streaks (consecutive days with completed tasks)
    // This would need a more complex query, simplified for now
    
    // Priority message selection (first match wins)
    
    // 1. CELEBRATIONS (highest priority — reward good behavior)
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
    
    // 2. TIME-BASED GREETINGS
    if (hour >= 5 && hour < 9) {
      // Early morning
      const morningMessages = [
        "Fresh start. What matters most today?",
        "Morning. Let's make today count.",
        "New day, clean slate.",
      ];
      if (remainingToday === 0) {
        return { 
          text: "Morning. What's the ONE thing for today?", 
          type: 'greeting' 
        };
      }
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
    
    // 3. NUDGES (gentle reminders)
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
    
    // 4. DAY-SPECIFIC
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
    
    // 5. DEFAULT INSIGHTS
    if (remainingToday > 0) {
      return { 
        text: `${remainingToday} thing${remainingToday > 1 ? 's' : ''} on your plate.`, 
        type: 'insight' 
      };
    }
    
    // 6. FALLBACK — all clear
    return { 
      text: "All clear. What's on your mind?", 
      type: 'greeting' 
    };
    
  }, [tasks]);
};
