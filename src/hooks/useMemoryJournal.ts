import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { useMoodStore } from '@/state/moodMachine';

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  timestamp: string;
  emotional_state: {
    joy: number;
    stress: number;
    affection: number;
    fatigue: number;
  };
  mood: string;
  tasks_created: number;
  tasks_completed: number;
  ai_summary: string | null;
  entry_type: string;
  created_at: string;
}

export type FilterType = 'all' | 'happy' | 'stress' | 'wins' | 'ritual';

export const useMemoryJournal = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const emotionalMemory = useEmotionalMemory();
  const moodStore = useMoodStore();

  // Fetch journal entries
  const { data: entries, isLoading } = useQuery({
    queryKey: ['memory-journal'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('memory_journal')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as JournalEntry[];
    },
  });

  // Create journal entry
  const createEntry = useMutation({
    mutationFn: async ({
      tasksCreated = 0,
      tasksCompleted = 0,
      entryType = 'auto',
    }: {
      tasksCreated?: number;
      tasksCompleted?: number;
      entryType?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const emotionalState = {
        joy: emotionalMemory.joy,
        stress: emotionalMemory.stress,
        affection: emotionalMemory.affection,
        fatigue: emotionalMemory.fatigue,
      };

      // Generate AI summary
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
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

      const aiSummary = summaryError ? null : summaryData?.summary;

      // Create entry
      const { data, error } = await supabase
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
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-journal'] });
    },
    onError: (error: any) => {
      console.error('Failed to create journal entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save journal entry.',
        variant: 'destructive',
      });
    },
  });

  // Filter entries
  const filterEntries = (entries: JournalEntry[], filter: FilterType): JournalEntry[] => {
    if (!entries) return [];

    switch (filter) {
      case 'happy':
        return entries.filter((e) => e.emotional_state.joy >= 70);
      case 'stress':
        return entries.filter((e) => e.emotional_state.stress >= 70);
      case 'wins':
        return entries.filter((e) => e.tasks_completed > 0);
      case 'ritual':
        return entries.filter((e) => e.entry_type === 'ritual');
      default:
        return entries;
    }
  };

  // Get stats
  const getStats = (entries: JournalEntry[]) => {
    if (!entries || entries.length === 0) {
      return {
        totalEntries: 0,
        happyMoments: 0,
        stressSpikes: 0,
        tasksWins: 0,
        avgJoy: 0,
        avgStress: 0,
      };
    }

    return {
      totalEntries: entries.length,
      happyMoments: entries.filter((e) => e.emotional_state.joy >= 70).length,
      stressSpikes: entries.filter((e) => e.emotional_state.stress >= 70).length,
      tasksWins: entries.filter((e) => e.tasks_completed > 0).length,
      avgJoy: Math.round(
        entries.reduce((sum, e) => sum + e.emotional_state.joy, 0) / entries.length
      ),
      avgStress: Math.round(
        entries.reduce((sum, e) => sum + e.emotional_state.stress, 0) / entries.length
      ),
    };
  };

  return {
    entries: entries || [],
    isLoading,
    createEntry: createEntry.mutate,
    filterEntries,
    getStats,
  };
};
