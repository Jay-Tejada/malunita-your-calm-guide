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
      showPrompt: false,
      priorityTaskId: null,
      
      checkIfShouldShowPrompt: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastAnswered = get().lastAnsweredDate;
        
        // If already answered today, don't show
        if (lastAnswered === today) {
          set({ showPrompt: false });
          return;
        }
        
        // New day - show the prompt automatically
        set({ showPrompt: true, priorityTaskId: null });
      },
      
      markPromptAnswered: (taskId: string) => {
        const today = new Date().toISOString().split('T')[0];
        set({ 
          lastAnsweredDate: today, 
          showPrompt: false, 
          priorityTaskId: taskId
        });
      },
    }),
    {
      name: 'daily-priority-prompt',
    }
  )
);
