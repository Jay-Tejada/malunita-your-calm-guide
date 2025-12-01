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

// Helper function to strip all emojis from text
function stripEmojis(text: string): string {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]|[\u{E0020}-\u{E007F}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu, '').trim();
}

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
        title: stripEmojis(`${overdueTasks} task${overdueTasks > 1 ? 's' : ''} overdue`),
        subtitle: stripEmojis("Let's tackle them"),
        priority: 'urgent',
        action: () => navigate('/tasks?filter=overdue')
      };
    }
    
    // 2. Tasks due soon (within 2 hours)
    if (tasksDueSoon > 0) {
      return {
        title: stripEmojis(`${tasksDueSoon} task${tasksDueSoon > 1 ? 's' : ''} due soon`),
        subtitle: stripEmojis('Within the next 2 hours'),
        priority: 'normal',
        action: () => navigate('/tasks')
      };
    }
    
    // 3. Today's focus task
    if (todaysFocusTask) {
      return {
        title: stripEmojis(todaysFocusTask),
        subtitle: stripEmojis("Today's main focus"),
        priority: 'calm',
        action: null // Don't navigate - actions will be shown inline
      };
    }
    
    // No actionable items - return empty
    return {
      title: null,
      subtitle: null,
      priority: 'calm',
      action: null
    };
  };
  
  return getPrompt();
}
