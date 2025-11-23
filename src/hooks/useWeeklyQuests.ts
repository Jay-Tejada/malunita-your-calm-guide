import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLevelSystem } from '@/state/levelSystem';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { useCustomizationStore } from '@/features/customization/useCustomizationStore';
import { startOfWeek, format } from 'date-fns';

export interface WeeklyQuest {
  id: string;
  user_id: string;
  week_start: string;
  title: string;
  description: string;
  quest_type: string;
  target_value: number;
  current_value: number;
  reward_xp: number;
  reward_affection: number;
  reward_cosmetic_type: string | null;
  reward_cosmetic_id: string | null;
  completed: boolean;
  claimed: boolean;
  created_at: string;
  updated_at: string;
}

export const useWeeklyQuests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const levelSystem = useLevelSystem();
  const emotionalMemory = useEmotionalMemory();
  const { unlockCosmetic } = useCustomizationStore();

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Fetch quests for current week
  const { data: quests, isLoading } = useQuery({
    queryKey: ['weekly-quests', weekStart],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('weekly_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as WeeklyQuest[];
    },
  });

  // Generate quests for current week
  const generateQuests = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-weekly-quests');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-quests'] });
      toast({
        title: 'New Quests Available!',
        description: 'Your weekly quests are ready to tackle.',
      });
    },
    onError: (error: any) => {
      console.error('Failed to generate quests:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate weekly quests.',
        variant: 'destructive',
      });
    },
  });

  // Update quest progress
  const updateProgress = useMutation({
    mutationFn: async ({ questId, newValue }: { questId: string; newValue: number }) => {
      const quest = quests?.find(q => q.id === questId);
      if (!quest) throw new Error('Quest not found');

      const completed = newValue >= quest.target_value;

      const { data, error } = await supabase
        .from('weekly_quests')
        .update({
          current_value: newValue,
          completed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', questId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-quests'] });
    },
  });

  // Claim quest reward
  const claimReward = useMutation({
    mutationFn: async (questId: string) => {
      const quest = quests?.find(q => q.id === questId);
      if (!quest) throw new Error('Quest not found');
      if (!quest.completed) throw new Error('Quest not completed');
      if (quest.claimed) throw new Error('Reward already claimed');

      // Update quest as claimed
      const { error } = await supabase
        .from('weekly_quests')
        .update({
          claimed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', questId);

      if (error) throw error;

      return quest;
    },
    onSuccess: (quest) => {
      // Award XP
      levelSystem.grantXp(quest.reward_xp);

      // Award affection
      emotionalMemory.adjustAffection(quest.reward_affection);

      // Unlock cosmetic if applicable
      if (quest.reward_cosmetic_type && quest.reward_cosmetic_id) {
        unlockCosmetic(quest.reward_cosmetic_type as any, quest.reward_cosmetic_id);
      }

      queryClient.invalidateQueries({ queryKey: ['weekly-quests'] });

      toast({
        title: 'Reward Claimed!',
        description: `You earned ${quest.reward_xp} XP and ${quest.reward_affection} affection!`,
      });
    },
    onError: (error: any) => {
      console.error('Failed to claim reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim reward.',
        variant: 'destructive',
      });
    },
  });

  // Check if all quests are completed for bonus
  const allQuestsCompleted = quests?.every(q => q.completed) && quests.length > 0;
  const allRewardsClaimed = quests?.every(q => q.claimed) && quests.length > 0;

  return {
    quests: quests || [],
    isLoading,
    generateQuests: generateQuests.mutate,
    isGenerating: generateQuests.isPending,
    updateProgress: updateProgress.mutate,
    claimReward: claimReward.mutate,
    isClaiming: claimReward.isPending,
    allQuestsCompleted,
    allRewardsClaimed,
  };
};
