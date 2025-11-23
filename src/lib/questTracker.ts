import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, format } from 'date-fns';

interface QuestProgressUpdate {
  questType: string;
  value?: number;
}

class QuestTracker {
  private static instance: QuestTracker;

  private constructor() {}

  static getInstance(): QuestTracker {
    if (!QuestTracker.instance) {
      QuestTracker.instance = new QuestTracker();
    }
    return QuestTracker.instance;
  }

  async updateProgress(updates: QuestProgressUpdate[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      // Get current week's quests
      const { data: quests, error: fetchError } = await supabase
        .from('weekly_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .eq('claimed', false);

      if (fetchError || !quests) return;

      // Update each matching quest
      const updatePromises = quests.map(async (quest) => {
        const matchingUpdate = updates.find(u => u.questType === quest.quest_type);
        if (!matchingUpdate) return;

        let newValue = quest.current_value;

        if (matchingUpdate.value !== undefined) {
          // Direct value set (e.g., for streaks)
          newValue = Math.max(newValue, matchingUpdate.value);
        } else {
          // Increment by 1
          newValue = quest.current_value + 1;
        }

        // Don't decrease progress
        if (newValue <= quest.current_value) return;

        const completed = newValue >= quest.target_value;

        return supabase
          .from('weekly_quests')
          .update({
            current_value: newValue,
            completed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', quest.id);
      });

      await Promise.all(updatePromises.filter(Boolean));
    } catch (error) {
      console.error('Failed to update quest progress:', error);
    }
  }

  async trackTaskCompletion() {
    await this.updateProgress([{ questType: 'complete_tasks' }]);
  }

  async trackRitualStreak() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('reflection_streak')
        .eq('id', user.id)
        .single();

      if (profile) {
        await this.updateProgress([
          { questType: 'ritual_streak', value: profile.reflection_streak || 0 }
        ]);
      }
    } catch (error) {
      console.error('Failed to track ritual streak:', error);
    }
  }

  async trackFocusSession() {
    await this.updateProgress([{ questType: 'focus_sessions' }]);
  }

  async trackMiniGame() {
    await this.updateProgress([{ questType: 'mini_games' }]);
  }

  async checkProjectCompletion() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        await this.updateProgress([{ questType: 'complete_project', value: 1 }]);
      }
    } catch (error) {
      console.error('Failed to check project completion:', error);
    }
  }
}

export const questTracker = QuestTracker.getInstance();
