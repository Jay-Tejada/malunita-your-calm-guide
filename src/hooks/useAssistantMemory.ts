import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AssistantMemoryState {
  messages: ConversationMessage[];
  lastCleanupDate: string;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  clearMemory: () => void;
  getRecentContext: (limit?: number) => ConversationMessage[];
}

export const useAssistantMemory = create<AssistantMemoryState>()(
  persist(
    (set, get) => ({
      messages: [],
      lastCleanupDate: new Date().toISOString().split('T')[0],

      addMessage: (role, content) => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        
        // Auto-clean if new day
        if (state.lastCleanupDate !== today) {
          set({ messages: [], lastCleanupDate: today });
        }

        set((state) => {
          const newMessages = [
            ...state.messages,
            { role, content, timestamp: new Date() }
          ];
          
          // Keep only last 20 messages
          return {
            messages: newMessages.slice(-20)
          };
        });
      },

      clearMemory: () => {
        set({ 
          messages: [], 
          lastCleanupDate: new Date().toISOString().split('T')[0] 
        });
      },

      getRecentContext: (limit = 10) => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        
        // Auto-clean if new day
        if (state.lastCleanupDate !== today) {
          return [];
        }
        
        return state.messages.slice(-limit);
      }
    }),
    {
      name: 'assistant-memory',
      // Session storage - cleared on app reload
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    }
  )
);
