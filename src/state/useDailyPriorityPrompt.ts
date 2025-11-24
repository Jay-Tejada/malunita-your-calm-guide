import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailyPriorityPromptState {
  lastAnsweredDate: string | null;
  showPrompt: boolean;
  priorityTaskId: string | null;
  checkIfShouldShowPrompt: () => void;
  markPromptAnswered: (taskId: string) => void;
}

export const useDailyPriorityPrompt = create<DailyPriorityPromptState>()(
  persist(
    (set, get) => ({
      lastAnsweredDate: null,
      showPrompt: true,
      priorityTaskId: null,
      
      checkIfShouldShowPrompt: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastAnswered = get().lastAnsweredDate;
        
        if (lastAnswered !== today) {
          set({ showPrompt: true, priorityTaskId: null });
        } else {
          set({ showPrompt: false });
        }
      },
      
      markPromptAnswered: (taskId: string) => {
        const today = new Date().toISOString().split('T')[0];
        set({ lastAnsweredDate: today, showPrompt: false, priorityTaskId: taskId });
      },
    }),
    {
      name: 'daily-priority-prompt',
    }
  )
);
