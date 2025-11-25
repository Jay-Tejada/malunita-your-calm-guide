import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bondingMeter, getBondingTier, BONDING_INCREMENTS } from "@/state/bondingMeter";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useBondingMeter = () => {
  const queryClient = useQueryClient();

  const { data: bonding, isLoading } = useQuery({
    queryKey: ["bonding"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { score: 0, tier: getBondingTier(0), lastInteraction: null };
      return bondingMeter.getCurrentBonding();
    },
    refetchInterval: 30000,
    retry: false,
  });

  // Check for inactivity penalty on mount (only if authenticated)
  useEffect(() => {
    const checkPenalties = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await bondingMeter.checkInactivityPenalty();
        queryClient.invalidateQueries({ queryKey: ["bonding"] });
      } catch (error) {
        console.log("Bonding check skipped - not authenticated");
      }
    };
    checkPenalties();
  }, [queryClient]);

  const incrementBonding = async (amount: number, reason: string) => {
    await bondingMeter.incrementBonding(amount, reason);
    queryClient.invalidateQueries({ queryKey: ["bonding"] });
  };

  const decrementBonding = async (amount: number, reason: string) => {
    await bondingMeter.decrementBonding(amount, reason);
    queryClient.invalidateQueries({ queryKey: ["bonding"] });
  };

  const trackTaskCompletion = () => {
    incrementBonding(BONDING_INCREMENTS.TASK_COMPLETED, "Task completed! Malunita is proud");
  };

  const trackRitualCompletion = () => {
    incrementBonding(BONDING_INCREMENTS.RITUAL_COMPLETED, "Ritual completed! Malunita feels closer");
  };

  const trackMiniGamePlayed = () => {
    incrementBonding(BONDING_INCREMENTS.MINI_GAME_PLAYED, "Playing together strengthens your bond");
  };

  const trackMalunitaTap = () => {
    incrementBonding(BONDING_INCREMENTS.MALUNITA_TAP, "Malunita enjoys your attention");
  };

  const trackSnapshotShared = () => {
    incrementBonding(BONDING_INCREMENTS.SNAPSHOT_SHARED, "Sharing Malunita makes her happy!");
  };

  const trackCustomization = () => {
    incrementBonding(BONDING_INCREMENTS.CUSTOMIZATION_CHANGED, "Malunita loves her new look!");
  };

  const trackDailySession = () => {
    incrementBonding(BONDING_INCREMENTS.DAILY_SESSION_COMPLETED, "Daily session completed together");
  };

  const trackQuestCompleted = () => {
    incrementBonding(BONDING_INCREMENTS.QUEST_COMPLETED, "Quest completed! Amazing teamwork");
  };

  const trackFiestaCompleted = () => {
    incrementBonding(BONDING_INCREMENTS.FIESTA_COMPLETED, "Fiesta fun! Malunita had a blast");
  };

  return {
    bonding: bonding || { score: 0, tier: getBondingTier(0), lastInteraction: null },
    isLoading,
    incrementBonding,
    decrementBonding,
    trackTaskCompletion,
    trackRitualCompletion,
    trackMiniGamePlayed,
    trackMalunitaTap,
    trackSnapshotShared,
    trackCustomization,
    trackDailySession,
    trackQuestCompleted,
    trackFiestaCompleted,
  };
};
