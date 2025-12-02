import { useState, useEffect, useMemo, useRef } from 'react';
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

  // Store the length in a ref to avoid stale closure issues
  const itemsLengthRef = useRef(priorityItems.length);
  itemsLengthRef.current = priorityItems.length;

  // Reset index if out of bounds
  useEffect(() => {
    if (priorityItems.length > 0 && currentIndex >= priorityItems.length) {
      setCurrentIndex(0);
    }
  }, [priorityItems.length, currentIndex]);

  // Rotation interval - use ref for stable callback
  useEffect(() => {
    if (priorityItems.length <= 1) return;
    
    console.log('Banner rotation started with', priorityItems.length, 'items');
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % itemsLengthRef.current;
        console.log('Banner rotating to index:', nextIndex, 'of', itemsLengthRef.current);
        return nextIndex;
      });
    }, 6000);
    
    return () => {
      console.log('Banner rotation cleanup');
      clearInterval(interval);
    };
  }, [priorityItems.length]);

  return {
    currentItem: priorityItems[currentIndex] || null,
    totalItems: priorityItems.length,
    currentIndex,
    goToNext: () => setCurrentIndex(prev => 
      priorityItems.length > 0 ? (prev + 1) % priorityItems.length : 0
    ),
    goToPrev: () => setCurrentIndex(prev => 
      priorityItems.length > 0 ? (prev - 1 + priorityItems.length) % priorityItems.length : 0
    ),
  };
};
