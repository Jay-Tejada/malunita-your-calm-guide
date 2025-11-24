import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTasks } from './useTasks';
import { format, subDays } from 'date-fns';

interface FocusReflection {
  outcome: 'done' | 'partial' | 'missed';
  note?: string;
}

export const useFocusReflection = () => {
  const { tasks } = useTasks();
  const [yesterdaysFocusTask, setYesterdaysFocusTask] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasReflectedToday, setHasReflectedToday] = useState(false);

  useEffect(() => {
    const checkYesterdaysFocus = async () => {
      if (!tasks) return;

      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      // Find yesterday's focus task
      const yesterdaysTask = tasks.find(
        task => task.is_focus && task.focus_date === yesterday
      );

      if (!yesterdaysTask) {
        setShowPrompt(false);
        return;
      }

      // Check if user already reflected today
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingReflection } = await supabase
        .from('daily_focus_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', yesterday)
        .maybeSingle();

      if (existingReflection) {
        setHasReflectedToday(true);
        setShowPrompt(false);
      } else {
        setYesterdaysFocusTask(yesterdaysTask.title);
        setShowPrompt(true);
        setHasReflectedToday(false);
      }
    };

    checkYesterdaysFocus();
  }, [tasks]);

  const saveReflection = async (reflection: FocusReflection) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !yesterdaysFocusTask) return;

    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    const { error } = await supabase
      .from('daily_focus_history')
      .insert({
        user_id: user.id,
        date: yesterday,
        focus_task: yesterdaysFocusTask,
        outcome: reflection.outcome,
        note: reflection.note || null,
      });

    if (!error) {
      setShowPrompt(false);
      setHasReflectedToday(true);
    }

    return { error };
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  return {
    yesterdaysFocusTask,
    showPrompt,
    saveReflection,
    dismissPrompt,
  };
};
