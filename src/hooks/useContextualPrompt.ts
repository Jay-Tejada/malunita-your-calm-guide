import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export interface ContextualPrompt {
  title: string | null;
  subtitle?: string | null;
  icon?: string;
  priority: 'normal' | 'urgent' | 'calm';
  action: (() => void) | null;
}

/**
 * useContextualPrompt - Returns the most relevant prompt to show right now
 * 
 * Only shows prompts when there's something actionable:
 * 1. Overdue tasks
 * 2. Tasks due soon (within 2 hours)
 * 3. Today's focus task exists
 * 
 * Returns null title/subtitle when nothing actionable
 */
export function useContextualPrompt(): ContextualPrompt {
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [tasksDueSoon, setTasksDueSoon] = useState(0);
  const [todaysFocusTask, setTodaysFocusTask] = useState<string | null>(null);
  const navigate = useNavigate();
  
  
  // Fetch actionable data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
        
        // Count overdue tasks (reminder_time in past)
        const { count: overdue } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('completed', false)
          .not('reminder_time', 'is', null)
          .lt('reminder_time', now.toISOString());
        
        setOverdueTasks(overdue || 0);
        
        // Count tasks due within 2 hours
        const { count: dueSoon } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('completed', false)
          .not('reminder_time', 'is', null)
          .gte('reminder_time', now.toISOString())
          .lt('reminder_time', twoHoursFromNow);
        
        setTasksDueSoon(dueSoon || 0);
        
        // Check if there's a focus task for today
        const { data: focusTask } = await supabase
          .from('tasks')
          .select('title')
          .eq('user_id', user.id)
          .eq('completed', false)
          .eq('is_focus', true)
          .eq('focus_date', today)
          .maybeSingle();
        
        setTodaysFocusTask(focusTask?.title || null);
        
      } catch (error) {
        console.error('Error fetching contextual data:', error);
      }
    };
    
    fetchData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Only show prompts for actionable items
  const getPrompt = (): ContextualPrompt => {
    // 1. Overdue tasks (urgent)
    if (overdueTasks > 0) {
      return {
        title: `${overdueTasks} task${overdueTasks > 1 ? 's' : ''} overdue`,
        subtitle: "Let's tackle them",
        icon: '⚠️',
        priority: 'urgent',
        action: () => navigate('/tasks?filter=overdue')
      };
    }
    
    // 2. Tasks due soon (within 2 hours)
    if (tasksDueSoon > 0) {
      return {
        title: `${tasksDueSoon} task${tasksDueSoon > 1 ? 's' : ''} due soon`,
        subtitle: 'Within the next 2 hours',
        icon: '⏰',
        priority: 'normal',
        action: () => navigate('/tasks')
      };
    }
    
    // 3. Today's focus task
    if (todaysFocusTask) {
      return {
        title: todaysFocusTask,
        subtitle: "Today's main focus",
        icon: '🎯',
        priority: 'calm',
        action: () => navigate('/tasks')
      };
    }
    
    // No actionable items - return empty
    return {
      title: null,
      subtitle: null,
      icon: undefined,
      priority: 'calm',
      action: null
    };
  };
  
  return getPrompt();
}
