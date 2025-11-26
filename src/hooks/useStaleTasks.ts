import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StaleTask {
  id: string;
  title: string;
  created_at: string;
  staleness_status: string;
  days_old: number;
}

export function useStaleTasks() {
  const [staleTasks, setStaleTasks] = useState<StaleTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaleTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, created_at, staleness_status')
        .eq('user_id', user.id)
        .eq('completed', false)
        .in('staleness_status', ['stale', 'decision_required', 'expiring'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching stale tasks:', error);
        return;
      }

      const tasksWithAge = data?.map(task => {
        const daysOld = Math.floor(
          (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return { ...task, days_old: daysOld };
      }) || [];

      setStaleTasks(tasksWithAge);
    } catch (error) {
      console.error('Failed to fetch stale tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const archiveTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      setStaleTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to archive task:', error);
      throw error;
    }
  };

  const scheduleForToday = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          is_focus: true,
          focus_date: new Date().toISOString().split('T')[0],
          staleness_status: 'active',
        })
        .eq('id', taskId);

      if (error) throw error;

      setStaleTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to schedule task:', error);
      throw error;
    }
  };

  const dismissForNow = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ staleness_status: 'active' })
        .eq('id', taskId);

      if (error) throw error;

      setStaleTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to dismiss task:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchStaleTasks();
  }, []);

  return {
    staleTasks,
    loading,
    archiveTask,
    scheduleForToday,
    dismissForNow,
    refreshStaleTasks: fetchStaleTasks,
  };
}