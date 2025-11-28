import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailyPriorityPromptState {
  lastAnsweredDate: string | null;
  showPrompt: boolean;
  priorityTaskId: string | null;
  checkIfShouldShowPrompt: () => void;
  markPromptAnswered: (taskId: string) => void;
  markPromptSkipped: () => void;
}

export const useDailyPriorityPrompt = create<DailyPriorityPromptState>()(
  persist(
    (set, get) => ({
      lastAnsweredDate: null,
      showPrompt: false,
      priorityTaskId: null,
      
      checkIfShouldShowPrompt: () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentHour = now.getHours();
        const lastAnswered = get().lastAnsweredDate;
        
        // If already answered today, don't show
        if (lastAnswered === today) {
          set({ showPrompt: false });
          return;
        }
        
        // Only show in morning hours (5 AM - 12 PM)
        if (currentHour >= 5 && currentHour < 12) {
          set({ showPrompt: true, priorityTaskId: null });
        } else {
          set({ showPrompt: false });
        }
      },
      
      markPromptAnswered: (taskId: string) => {
        const today = new Date().toISOString().split('T')[0];
        set({ 
          lastAnsweredDate: today, 
          showPrompt: false, 
          priorityTaskId: taskId
        });
      },
      
      markPromptSkipped: () => {
        const today = new Date().toISOString().split('T')[0];
        set({ 
          lastAnsweredDate: today, 
          showPrompt: false
        });
      },
    }),
    {
      name: 'daily-priority-prompt',
    }
  )
);
