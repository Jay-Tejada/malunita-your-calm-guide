import { supabase } from '@/integrations/supabase/client';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { useMoodStore } from '@/state/moodMachine';

export const createJournalEntry = async ({
  tasksCreated = 0,
  tasksCompleted = 0,
  entryType = 'auto',
}: {
  tasksCreated?: number;
  tasksCompleted?: number;
  entryType?: string;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const emotionalMemory = useEmotionalMemory.getState();
    const moodStore = useMoodStore.getState();

    const emotionalState = {
      joy: emotionalMemory.joy,
      stress: emotionalMemory.stress,
      affection: emotionalMemory.affection,
      fatigue: emotionalMemory.fatigue,
    };

    // Generate AI summary
    const { data: summaryData } = await supabase.functions.invoke(
      'generate-journal-summary',
      {
        body: {
          emotionalState,
          mood: moodStore.mood,
          tasksCreated,
          tasksCompleted,
          entryType,
        },
      }
    );

    const aiSummary = summaryData?.summary;

    // Create entry
    await supabase
      .from('memory_journal')
      .insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        emotional_state: emotionalState,
        mood: moodStore.mood,
        tasks_created: tasksCreated,
        tasks_completed: tasksCompleted,
        ai_summary: aiSummary,
        entry_type: entryType,
      });
  } catch (error) {
    console.error('Failed to create journal entry:', error);
  }
};

// Journal event triggers
export const JOURNAL_EVENTS = {
  RITUAL_COMPLETE: (type: 'morning' | 'evening') => {
    createJournalEntry({
      entryType: `ritual-${type}`,
    });
  },

  TASK_MILESTONE: (completed: number) => {
    createJournalEntry({
      tasksCompleted: completed,
      entryType: 'task-milestone',
    });
  },

  HIGH_STRESS: () => {
    createJournalEntry({
      entryType: 'stress-spike',
    });
  },

  HIGH_JOY: () => {
    createJournalEntry({
      entryType: 'happy-moment',
    });
  },

  DAILY_SUMMARY: (created: number, completed: number) => {
    createJournalEntry({
      tasksCreated: created,
      tasksCompleted: completed,
      entryType: 'daily-summary',
    });
  },
} as const;
