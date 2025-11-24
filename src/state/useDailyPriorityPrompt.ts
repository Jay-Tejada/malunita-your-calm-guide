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
      showPrompt: true,
      priorityTaskId: null,
      answeredForTomorrow: false,
      
      checkIfShouldShowPrompt: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastAnswered = get().lastAnsweredDate;
        const currentHour = new Date().getHours();
        const isEvening = currentHour >= 18;
        
        // If it's evening and we already answered for tomorrow, don't show
        if (isEvening && get().answeredForTomorrow && lastAnswered === today) {
          set({ showPrompt: false });
          return;
        }
        
        // If it's a new day, reset and show the prompt
        if (lastAnswered !== today) {
          set({ showPrompt: true, priorityTaskId: null, answeredForTomorrow: false });
        } else if (!isEvening && get().answeredForTomorrow) {
          // New day has started, and we had answered for "tomorrow" yesterday evening
          set({ showPrompt: true, answeredForTomorrow: false });
        } else {
          set({ showPrompt: false });
        }
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
