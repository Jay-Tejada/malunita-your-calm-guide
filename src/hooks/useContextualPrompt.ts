import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export interface ContextualPrompt {
  title: string;
  subtitle?: string;
  icon?: string;
  priority: 'normal' | 'urgent' | 'calm';
  action: (() => void) | null;
}

/**
 * useContextualPrompt - Returns the most relevant prompt to show right now
 * 
 * Priority system:
 * 1. Overdue tasks (highest)
 * 2. Large inbox
 * 3. No "one thing" set in morning
 * 4. Quick wins available midday
 * 5. Evening reflection
 * 6. Default state (lowest)
 */
export function useContextualPrompt(): ContextualPrompt {
  const [inboxCount, setInboxCount] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [quickWinsCount, setQuickWinsCount] = useState(0);
  const [todaysOneThing, setTodaysOneThing] = useState<string | null>(null);
  const [todaysJournal, setTodaysJournal] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const hour = new Date().getHours();
  
  // Fetch counts from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const now = new Date().toISOString();
        const today = new Date().toISOString().split('T')[0];
        
        // Count inbox items (no category assigned)
        const { count: inbox } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('completed', false)
          .is('category', null)
          .is('custom_category_id', null);
        
        setInboxCount(inbox || 0);
        
        // Count overdue tasks (reminder_time in past)
        const { count: overdue } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('completed', false)
          .not('reminder_time', 'is', null)
          .lt('reminder_time', now);
        
        setOverdueTasks(overdue || 0);
        
        // Count quick wins (tiny tasks)
        const { count: quickWins } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('completed', false)
          .eq('is_tiny_task', true);
        
        setQuickWinsCount(quickWins || 0);
        
        // Check if "one thing" is set for today
        const { data: oneThing } = await supabase
          .from('daily_one_thing')
          .select('text')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();
        
        setTodaysOneThing(oneThing?.text || null);
        
        // Check if journal entry exists for today
        const { data: journal } = await supabase
          .from('journal_entries')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .maybeSingle();
        
        setTodaysJournal(journal?.id || null);
        
      } catch (error) {
        console.error('Error fetching contextual data:', error);
      }
    };
    
    fetchData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Determine what to show (priority order)
  const getPrompt = (): ContextualPrompt => {
    // URGENT: Overdue tasks
    if (overdueTasks > 0) {
      return {
        title: `${overdueTasks} task${overdueTasks > 1 ? 's' : ''} overdue`,
        subtitle: "Let's tackle them",
        icon: '⚠️',
        priority: 'urgent',
        action: () => navigate('/tasks?filter=overdue')
      };
    }
    
    // HIGH: Inbox getting full
    if (inboxCount > 5) {
      return {
        title: `${inboxCount} items in inbox`,
        subtitle: 'Time to organize',
        icon: '📥',
        priority: 'normal',
        action: () => navigate('/inbox')
      };
    }
    
    // MORNING: Set ONE thing
    if (!todaysOneThing && hour >= 6 && hour < 12) {
      return {
        title: "What's your ONE thing today?",
        subtitle: 'Choose your main focus',
        icon: '🎯',
        priority: 'normal',
        action: () => {
          window.dispatchEvent(new CustomEvent('open-daily-priority'));
        }
      };
    }
    
    // MIDDAY: Quick wins
    if (quickWinsCount > 0 && hour >= 12 && hour < 17) {
      return {
        title: `${quickWinsCount} quick win${quickWinsCount > 1 ? 's' : ''} ready`,
        subtitle: 'Knock them out in 15 mins',
        icon: '⚡',
        priority: 'normal',
        action: () => navigate('/tiny-task-fiesta')
      };
    }
    
    // EVENING: Journal
    if (!todaysJournal && hour >= 18 && hour < 22) {
      return {
        title: 'How did today go?',
        subtitle: 'Take a moment to reflect',
        icon: '📓',
        priority: 'calm',
        action: () => navigate('/journal')
      };
    }
    
    // DEFAULT: All clear
    return {
      title: 'All clear ✨',
      subtitle: 'Tap the orb below to capture',
      icon: '🌟',
      priority: 'calm',
      action: null
    };
  };
  
  return getPrompt();
}
