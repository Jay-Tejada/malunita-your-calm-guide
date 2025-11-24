import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailyPriorityPromptState {
  lastAnsweredDate: string | null;
  showPrompt: boolean;
  checkIfShouldShowPrompt: () => void;
  markPromptAnswered: () => void;
}

export const useDailyPriorityPrompt = create<DailyPriorityPromptState>()(
  persist(
    (set, get) => ({
      lastAnsweredDate: null,
      showPrompt: true,
      
      checkIfShouldShowPrompt: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastAnswered = get().lastAnsweredDate;
        
        if (lastAnswered !== today) {
          set({ showPrompt: true });
        } else {
          set({ showPrompt: false });
        }
      },
      
      markPromptAnswered: () => {
        const today = new Date().toISOString().split('T')[0];
        set({ lastAnsweredDate: today, showPrompt: false });
      },
    }),
    {
      name: 'daily-priority-prompt',
    }
  )
);
