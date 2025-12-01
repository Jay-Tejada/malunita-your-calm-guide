import { useMemo } from 'react';
import { useTasks } from './useTasks';

interface ProgressStats {
  completedToday: number;
  totalToday: number;
  streak: number;
  weeklyCompleted: number[];  // Last 7 days, index 0 = 6 days ago, index 6 = today
}

export const useProgressStats = (): ProgressStats => {
  const { tasks } = useTasks();
  
  return useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Today's stats
    const todayTasks = tasks?.filter(t => t.scheduled_bucket === 'today') || [];
    const completedToday = todayTasks.filter(t => t.completed).length;
    const totalToday = todayTasks.length;
    
    // Calculate streak (consecutive days with at least 1 completion)
    let streak = 0;
    let checkDate = new Date(todayStart);
    
    // If completed something today, start counting from today
    // Otherwise, start from yesterday
    if (completedToday === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const completedThatDay = tasks?.filter(t => 
        t.completed && 
        t.completed_at &&
        new Date(t.completed_at) >= dayStart &&
        new Date(t.completed_at) < dayEnd
      ).length || 0;
      
      if (completedThatDay > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
      
      // Safety: don't go back more than 365 days
      if (streak > 365) break;
    }
    
    // If we completed something today, add today to streak
    if (completedToday > 0 && streak === 0) {
      streak = 1;
    }
    
    // Weekly completions (last 7 days)
    const weeklyCompleted: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const count = tasks?.filter(t => 
        t.completed && 
        t.completed_at &&
        new Date(t.completed_at) >= dayStart &&
        new Date(t.completed_at) < dayEnd
      ).length || 0;
      
      weeklyCompleted.push(count);
    }
    
    return {
      completedToday,
      totalToday,
      streak,
      weeklyCompleted,
    };
  }, [tasks]);
};
