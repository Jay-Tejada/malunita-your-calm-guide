import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  PersonalityArchetype,
  ArchetypeAffinity,
  PersonalityState,
  DEFAULT_AFFINITY,
  adjustAffinity,
  getBestArchetype,
} from "@/state/personality";

export const usePersonality = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch personality state
  const { data: personalityState, isLoading } = useQuery({
    queryKey: ['personality'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('companion_personality_type, emotional_memory')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Parse emotional_memory as archetype_affinity (stored in emotional_memory for now)
      const archetypeAffinity = (data.emotional_memory as any)?.archetype_affinity || DEFAULT_AFFINITY;
      const autoAdapt = (data.emotional_memory as any)?.auto_adapt ?? true;

      const state: PersonalityState = {
        selectedArchetype: (data.companion_personality_type || 'zen-guide') as PersonalityArchetype,
        archetypeAffinity,
        autoAdapt,
      };

      return state;
    },
  });

  // Update personality
  const updatePersonality = useMutation({
    mutationFn: async (updates: Partial<PersonalityState>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentState = personalityState || {
        selectedArchetype: 'zen-guide' as PersonalityArchetype,
        archetypeAffinity: DEFAULT_AFFINITY,
        autoAdapt: true,
      };

      const newState = { ...currentState, ...updates };

      // Store in database
      const { data, error } = await supabase
        .from('profiles')
        .update({
          companion_personality_type: newState.selectedArchetype,
          emotional_memory: {
            ...(personalityState as any),
            archetype_affinity: newState.archetypeAffinity,
            auto_adapt: newState.autoAdapt,
          },
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return newState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personality'] });
      toast({
        title: "Personality updated",
        description: "Malunita's personality has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Track interaction and adjust affinity
  const trackInteraction = useMutation({
    mutationFn: async ({
      interactionType,
      magnitude = 1,
    }: {
      interactionType: 'positive' | 'negative' | 'neutral';
      magnitude?: number;
    }) => {
      if (!personalityState || !personalityState.autoAdapt) return;

      const newAffinity = adjustAffinity(
        personalityState.archetypeAffinity,
        personalityState.selectedArchetype,
        interactionType,
        magnitude
      );

      // Auto-adapt if needed (check if another archetype has significantly higher affinity)
      const bestArchetype = getBestArchetype(newAffinity);
      const currentScore = newAffinity[personalityState.selectedArchetype];
      const bestScore = newAffinity[bestArchetype];

      let shouldSwitch = false;
      if (bestArchetype !== personalityState.selectedArchetype && bestScore > currentScore + 20) {
        shouldSwitch = true;
      }

      await updatePersonality.mutateAsync({
        archetypeAffinity: newAffinity,
        ...(shouldSwitch && personalityState.autoAdapt
          ? { selectedArchetype: bestArchetype }
          : {}),
      });

      if (shouldSwitch && personalityState.autoAdapt) {
        toast({
          title: "Malunita is adapting",
          description: `She's shifting to be more of a ${bestArchetype.replace('-', ' ')}!`,
        });
      }
    },
  });

  return {
    personalityState,
    isLoading,
    updatePersonality: updatePersonality.mutate,
    trackInteraction: trackInteraction.mutate,
  };
};
