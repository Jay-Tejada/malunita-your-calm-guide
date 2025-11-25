import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AttentionTrackerState {
  lastFocusedTaskId: string | null;
  lastFocusTimestamp: number | null;
  startFocus: (taskId: string) => void;
  clearFocus: () => void;
  getMinutesAway: () => number;
}

export const useAttentionTracker = create<AttentionTrackerState>()(
  persist(
    (set, get) => ({
      lastFocusedTaskId: null,
      lastFocusTimestamp: null,

      startFocus: (taskId: string) => {
        set({
          lastFocusedTaskId: taskId,
          lastFocusTimestamp: Date.now(),
        });
      },

      clearFocus: () => {
        set({
          lastFocusedTaskId: null,
          lastFocusTimestamp: null,
        });
      },

      getMinutesAway: () => {
        const { lastFocusTimestamp } = get();
        if (!lastFocusTimestamp) return 0;
        
        const now = Date.now();
        const minutesElapsed = Math.floor((now - lastFocusTimestamp) / (1000 * 60));
        return minutesElapsed;
      },
    }),
    {
      name: 'attention-tracker-storage',
    }
  )
);
