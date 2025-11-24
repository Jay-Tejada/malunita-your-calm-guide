import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailyPriorityPromptState {
  lastAnsweredDate: string | null;
  showPrompt: boolean;
  priorityTaskId: string | null;
  answeredForTomorrow: boolean;
  checkIfShouldShowPrompt: () => void;
  markPromptAnswered: (taskId: string, isForTomorrow?: boolean) => void;
}

export const useDailyPriorityPrompt = create<DailyPriorityPromptState>()(
  persist(
    (set, get) => ({
      lastAnsweredDate: null,
      showPrompt: false,
      priorityTaskId: null,
      answeredForTomorrow: false,
      
      checkIfShouldShowPrompt: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastAnswered = get().lastAnsweredDate;
        const currentHour = new Date().getHours();
        const isEvening = currentHour >= 18;
        const answeredForTomorrow = get().answeredForTomorrow;
        
        // If already answered today
        if (lastAnswered === today) {
          // In evening: if answered for tomorrow, don't show
          if (isEvening && answeredForTomorrow) {
            set({ showPrompt: false });
            return;
          }
          // Not in evening: if answered for tomorrow, that was yesterday evening, so show for today
          if (!isEvening && answeredForTomorrow) {
            set({ showPrompt: true, answeredForTomorrow: false });
            return;
          }
          // Already answered today (not for tomorrow)
          set({ showPrompt: false });
          return;
        }
        
        // New day - show the prompt
        set({ showPrompt: true, priorityTaskId: null, answeredForTomorrow: false });
      },
      
      markPromptAnswered: (taskId: string, isForTomorrow = false) => {
        const today = new Date().toISOString().split('T')[0];
        set({ 
          lastAnsweredDate: today, 
          showPrompt: false, 
          priorityTaskId: taskId,
          answeredForTomorrow: isForTomorrow
        });
      },
    }),
    {
      name: 'daily-priority-prompt',
    }
  )
);
