import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useMoodStore } from './moodMachine';

export interface EmotionalMemory {
  joy: number;        // 0-100, increases when tasks completed, voice notes added
  stress: number;     // 0-100, increases when tasks pile up
  affection: number;  // 0-100, increases with positive interactions
  fatigue: number;    // 0-100, increases with long inactivity or overwhelm
}

interface EmotionalMemoryState extends EmotionalMemory {
  lastSyncedAt: number;
  lastActivityAt: number;
}

interface EmotionalMemoryActions {
  adjustJoy: (amount: number) => void;
  adjustStress: (amount: number) => void;
  adjustAffection: (amount: number) => void;
  adjustFatigue: (amount: number) => void;
  recordActivity: () => void;
  syncToSupabase: (userId?: string) => Promise<void>;
  maybeSyncToSupabase: () => void;
  loadFromProfile: (memory: EmotionalMemory) => void;
  calculateMoodInfluence: () => void;
  checkInactivity: () => void;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const useEmotionalMemory = create<EmotionalMemoryState & EmotionalMemoryActions>((set, get) => ({
  joy: 50,
  stress: 50,
  affection: 50,
  fatigue: 50,
  lastSyncedAt: Date.now(),
  lastActivityAt: Date.now(),

  adjustJoy: (amount) => {
    set((state) => ({ 
      joy: clamp(state.joy + amount) 
    }));
    get().calculateMoodInfluence();
    get().maybeSyncToSupabase();
    
    // Auto-create journal entry on high joy
    const newJoy = get().joy;
    if (newJoy >= 80) {
      import('../features/journal/journalEvents').then(({ JOURNAL_EVENTS }) => {
        JOURNAL_EVENTS.HIGH_JOY();
      });
    }
  },

  adjustStress: (amount) => {
    set((state) => ({ 
      stress: clamp(state.stress + amount) 
    }));
    get().calculateMoodInfluence();
    get().maybeSyncToSupabase();
    
    // Auto-create journal entry on high stress
    const newStress = get().stress;
    if (newStress >= 75) {
      import('../features/journal/journalEvents').then(({ JOURNAL_EVENTS }) => {
        JOURNAL_EVENTS.HIGH_STRESS();
      });
    }
  },

  adjustAffection: (amount) => {
    set((state) => ({ 
      affection: clamp(state.affection + amount) 
    }));
    get().calculateMoodInfluence();
    get().maybeSyncToSupabase();
  },

  adjustFatigue: (amount) => {
    set((state) => ({ 
      fatigue: clamp(state.fatigue + amount) 
    }));
    get().calculateMoodInfluence();
    get().maybeSyncToSupabase();
  },

  recordActivity: () => {
    set({ lastActivityAt: Date.now() });
    // Reduce fatigue slightly on activity
    const state = get();
    if (state.fatigue > 0) {
      set({ fatigue: clamp(state.fatigue - 1) });
    }
  },

  loadFromProfile: (memory) => {
    set({
      joy: memory.joy || 50,
      stress: memory.stress || 50,
      affection: memory.affection || 50,
      fatigue: memory.fatigue || 50,
    });
  },

  calculateMoodInfluence: () => {
    const state = get();
    const moodStore = useMoodStore.getState();

    // Determine dominant emotion based on highest value
    const emotions = [
      { value: state.joy, mood: 'overjoyed' as const, threshold: 70 },
      { value: state.stress, mood: 'concerned' as const, threshold: 70 },
      { value: state.fatigue, mood: 'sleepy' as const, threshold: 70 },
      { value: state.affection, mood: 'loving' as const, threshold: 70 },
    ];

    // Find the highest emotion above threshold
    const dominant = emotions
      .filter(e => e.value >= e.threshold)
      .sort((a, b) => b.value - a.value)[0];

    if (dominant) {
      moodStore.updateMood(dominant.mood);
    } else if (state.joy > 60) {
      moodStore.updateMood('happy');
    } else if (state.stress > 60) {
      moodStore.updateMood('concerned');
    } else if (state.fatigue > 60) {
      moodStore.updateMood('sleepy');
    }
  },

  checkInactivity: () => {
    const state = get();
    const hoursSinceActivity = (Date.now() - state.lastActivityAt) / (1000 * 60 * 60);
    
    if (hoursSinceActivity > 6) {
      const fatigueIncrease = Math.floor(hoursSinceActivity / 6) * 2;
      set({ fatigue: clamp(state.fatigue + fatigueIncrease) });
      get().calculateMoodInfluence();
    }
  },

  syncToSupabase: async (userId) => {
    const state = get();
    const memory = {
      joy: state.joy,
      stress: state.stress,
      affection: state.affection,
      fatigue: state.fatigue,
    };

    try {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id;
      }

      if (uid) {
        await supabase
          .from('profiles')
          .update({ emotional_memory: memory })
          .eq('id', uid);

        set({ lastSyncedAt: Date.now() });
      }
    } catch (error) {
      console.error('Failed to sync emotional memory:', error);
    }
  },

  maybeSyncToSupabase: () => {
    const state = get();
    const hoursSinceSync = (Date.now() - state.lastSyncedAt) / (1000 * 60 * 60);
    
    // Sync once per hour
    if (hoursSinceSync >= 1) {
      get().syncToSupabase();
    }
  },
}));

// Emotional memory events
export const EMOTIONAL_EVENTS = {
  TASK_COMPLETED: () => {
    useEmotionalMemory.getState().adjustJoy(2);
    useEmotionalMemory.getState().adjustStress(-1);
  },
  
  TASK_ADDED_OVERWHELMING: () => {
    useEmotionalMemory.getState().adjustStress(3);
  },
  
  POSITIVE_INTERACTION: () => {
    useEmotionalMemory.getState().adjustAffection(4);
  },
  
  INACTIVITY_CHECK: () => {
    useEmotionalMemory.getState().checkInactivity();
  },
} as const;

// Start inactivity checker (call once in main app)
export const startEmotionalMemoryMonitoring = () => {
  // Check inactivity every hour
  setInterval(() => {
    EMOTIONAL_EVENTS.INACTIVITY_CHECK();
  }, 60 * 60 * 1000);

  // Sync to Supabase periodically
  setInterval(() => {
    useEmotionalMemory.getState().syncToSupabase();
  }, 60 * 60 * 1000);
};
