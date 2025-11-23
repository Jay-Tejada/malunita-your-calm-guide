import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { startOfWeek, format, differenceInDays } from 'date-fns';

interface QuestProgressUpdate {
  questType: string;
  value?: number;
}

export const useQuestTracking = () => {
  const queryClient = useQueryClient();

  // Update quest progress in database
  const updateQuestProgress = async (updates: QuestProgressUpdate[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      // Get current week's quests
      const { data: quests, error: fetchError } = await supabase
        .from('weekly_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart);

      if (fetchError || !quests) return;

      // Update each matching quest
      for (const quest of quests) {
        const matchingUpdate = updates.find(u => u.questType === quest.quest_type);
        if (!matchingUpdate) continue;

        let newValue = quest.current_value;

        if (matchingUpdate.value !== undefined) {
          // Direct value set (e.g., for streaks)
          newValue = matchingUpdate.value;
        } else {
          // Increment by 1
          newValue = quest.current_value + 1;
        }

        const completed = newValue >= quest.target_value;

        await supabase
          .from('weekly_quests')
          .update({
            current_value: newValue,
            completed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', quest.id);
      }

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['weekly-quests'] });
    } catch (error) {
      console.error('Failed to update quest progress:', error);
    }
  };

  // Track task completion
  const trackTaskCompletion = async () => {
    await updateQuestProgress([{ questType: 'complete_tasks' }]);
  };

  // Track ritual streak
  const trackRitualStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile to check current streak
      const { data: profile } = await supabase
        .from('profiles')
        .select('reflection_streak')
        .eq('id', user.id)
        .single();

      if (profile) {
        await updateQuestProgress([
          { questType: 'ritual_streak', value: profile.reflection_streak || 0 }
        ]);
      }
    } catch (error) {
      console.error('Failed to track ritual streak:', error);
    }
  };

  // Track focus session
  const trackFocusSession = async () => {
    await updateQuestProgress([{ questType: 'focus_sessions' }]);
  };

  // Track mini-game play
  const trackMiniGame = async () => {
    await updateQuestProgress([{ questType: 'mini_games' }]);
  };

  // Check project completion
  const checkProjectCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all tasks grouped by category
      const { data: tasks } = await supabase
        .from('tasks')
        .select('category, completed, custom_category_id')
        .eq('user_id', user.id)
        .not('category', 'is', null);

      if (!tasks || tasks.length === 0) return;

      // Group by category
      const categories = new Map<string, { total: number; completed: number }>();
      
      tasks.forEach(task => {
        const key = task.custom_category_id || task.category || 'uncategorized';
        const existing = categories.get(key) || { total: 0, completed: 0 };
        existing.total++;
        if (task.completed) existing.completed++;
        categories.set(key, existing);
      });

      // Check if any category is fully completed (with at least 5 tasks)
      const hasCompletedProject = Array.from(categories.values()).some(
        cat => cat.total >= 5 && cat.completed === cat.total
      );

      if (hasCompletedProject) {
        await updateQuestProgress([{ questType: 'complete_project', value: 1 }]);
      }
    } catch (error) {
      console.error('Failed to check project completion:', error);
    }
  };

  // Listen for real-time updates
  useEffect(() => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Subscribe to quest updates for real-time refresh
    const channel = supabase
      .channel('quest-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'weekly_quests',
          filter: `week_start=eq.${weekStart}`,
        },
        (payload) => {
          console.log('Quest updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['weekly-quests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    trackTaskCompletion,
    trackRitualStreak,
    trackFocusSession,
    trackMiniGame,
    checkProjectCompletion,
  };
};

// Quest tracking events - can be imported and called from anywhere
export const QUEST_EVENTS = {
  TASK_COMPLETED: () => {
    import('./useQuestTracking').then(({ useQuestTracking }) => {
      const tracker = useQuestTracking();
      tracker.trackTaskCompletion();
    });
  },
  
  RITUAL_COMPLETED: () => {
    import('./useQuestTracking').then(({ useQuestTracking }) => {
      const tracker = useQuestTracking();
      tracker.trackRitualStreak();
    });
  },
  
  FOCUS_SESSION_STARTED: () => {
    import('./useQuestTracking').then(({ useQuestTracking }) => {
      const tracker = useQuestTracking();
      tracker.trackFocusSession();
    });
  },
  
  MINI_GAME_PLAYED: () => {
    import('./useQuestTracking').then(({ useQuestTracking }) => {
      const tracker = useQuestTracking();
      tracker.trackMiniGame();
    });
  },
  
  CHECK_PROJECT_COMPLETION: () => {
    import('./useQuestTracking').then(({ useQuestTracking }) => {
      const tracker = useQuestTracking();
      tracker.checkProjectCompletion();
    });
  },
};
