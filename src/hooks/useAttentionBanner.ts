import { useState, useEffect, useMemo } from 'react';
import { useTasks, Task } from './useTasks';

export interface AttentionItem extends Task {
  bannerPriority: 'overdue' | 'upcoming' | 'inbox' | 'today';
  urgency: number;
}

export const useAttentionBanner = () => {
  const { tasks } = useTasks();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Build priority queue
  const priorityItems = useMemo(() => {
    if (!tasks) return [];
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    const items: AttentionItem[] = [];
    
    // 1. Overdue tasks
    const overdue = tasks
      .filter(t => 
        !t.completed && 
        t.reminder_time && 
        new Date(t.reminder_time) < now &&
        !t.is_focus // Don't duplicate focus task
      )
      .map(t => ({ ...t, bannerPriority: 'overdue' as const, urgency: 1 }));
    
    // 2. Happening within 1 hour
    const upcoming = tasks
      .filter(t => 
        !t.completed && 
        t.reminder_time && 
        new Date(t.reminder_time) > now && 
        new Date(t.reminder_time) < oneHourFromNow &&
        !t.is_focus
      )
      .map(t => ({ ...t, bannerPriority: 'upcoming' as const, urgency: 2 }));
    
    // 3. Inbox items (unprocessed) - limit to 5
    const inbox = tasks
      .filter(t => 
        !t.completed && 
        !t.category && 
        !t.custom_category_id &&
        !t.scheduled_bucket &&
        !t.is_focus
      )
      .slice(0, 5)
      .map(t => ({ ...t, bannerPriority: 'inbox' as const, urgency: 3 }));
    
    // 4. Today tasks (general rotation)
    const today = tasks
      .filter(t => 
        !t.completed && 
        t.scheduled_bucket === 'today' &&
        !t.is_focus // Don't duplicate focus task
      )
      .map(t => ({ ...t, bannerPriority: 'today' as const, urgency: 4 }));
    
    // Focus task is excluded - it shows in the center, not the banner
    return [...overdue, ...upcoming, ...inbox, ...today];
  }, [tasks]);

  // Auto-rotate every 6 seconds (faster for urgent items)
  useEffect(() => {
    if (priorityItems.length <= 1) return;
    
    const currentItem = priorityItems[currentIndex];
    const interval = currentItem?.urgency === 1 ? 5000 : 6000; // 5s for overdue, 6s for others
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % priorityItems.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [priorityItems.length, currentIndex, priorityItems]);

  // Reset index when items change
  useEffect(() => {
    if (currentIndex >= priorityItems.length) {
      setCurrentIndex(0);
    }
  }, [priorityItems.length, currentIndex]);

  return {
    currentItem: priorityItems[currentIndex] || null,
    totalItems: priorityItems.length,
    currentIndex,
    goToNext: () => setCurrentIndex(prev => (prev + 1) % priorityItems.length),
    goToPrev: () => setCurrentIndex(prev => (prev - 1 + priorityItems.length) % priorityItems.length),
  };
};
