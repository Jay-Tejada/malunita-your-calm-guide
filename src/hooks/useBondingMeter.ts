import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bondingMeter, getBondingTier, BONDING_INCREMENTS } from "@/state/bondingMeter";
import { useEffect } from "react";

export const useBondingMeter = () => {
  const queryClient = useQueryClient();

  const { data: bonding, isLoading } = useQuery({
    queryKey: ["bonding"],
    queryFn: () => bondingMeter.getCurrentBonding(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Check for inactivity penalty on mount
  useEffect(() => {
    const checkPenalties = async () => {
      await bondingMeter.checkInactivityPenalty();
      queryClient.invalidateQueries({ queryKey: ["bonding"] });
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
