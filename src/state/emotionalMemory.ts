import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useMoodStore } from './moodMachine';

export interface EmotionalMemory {
  joy: number;                  // 0-100, increases when tasks completed, voice notes added
  stress: number;               // 0-100, increases when tasks pile up
  affection: number;            // 0-100, increases with positive interactions
  fatigue: number;              // 0-100, increases with long inactivity or overwhelm
  momentum: number;             // 0-100, increases with streaks and consistent completion
  overwhelm: number;            // 0-100, increases with high task count and deadlines
  resilience: number;           // 0-100, builds over time with consistent progress
  encouragement_need: number;   // 0-100, increases with stress and fatigue
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
  applyStress: (amount: number) => void;
  applyFatigue: (amount: number) => void;
  applyMomentum: (amount: number) => void;
  applyOverwhelm: (amount: number) => void;
  recover: () => void;
  snapshot: () => EmotionalMemory;
  recordActivity: () => void;
  syncToSupabase: (userId?: string) => Promise<void>;
  maybeSyncToSupabase: () => void;
  loadFromProfile: (memory: EmotionalMemory) => void;
  calculateMoodInfluence: () => void;
  checkInactivity: () => void;
  dailyReset: () => void;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const useEmotionalMemory = create<EmotionalMemoryState & EmotionalMemoryActions>((set, get) => ({
  joy: 50,
  stress: 50,
  affection: 50,
  fatigue: 50,
  momentum: 50,
  overwhelm: 50,
  resilience: 50,
  encouragement_need: 50,
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

  applyStress: (amount) => {
    set((state) => ({ stress: clamp(state.stress + amount) }));
    get().calculateMoodInfluence();
    get().maybeSyncToSupabase();
  },

  applyFatigue: (amount) => {
    set((state) => ({ fatigue: clamp(state.fatigue + amount) }));
    get().calculateMoodInfluence();
    get().maybeSyncToSupabase();
  },

  applyMomentum: (amount) => {
    set((state) => ({ momentum: clamp(state.momentum + amount) }));
    get().calculateMoodInfluence();
    get().maybeSyncToSupabase();
  },

  applyOverwhelm: (amount) => {
    set((state) => ({ overwhelm: clamp(state.overwhelm + amount) }));
    get().calculateMoodInfluence();
    get().maybeSyncToSupabase();
  },

  recover: () => {
    set((state) => ({
      stress: clamp(state.stress - 2),
      fatigue: clamp(state.fatigue - 1),
      overwhelm: clamp(state.overwhelm - 1.5),
      resilience: clamp(state.resilience + 0.5),
    }));
    get().calculateMoodInfluence();
  },

  snapshot: () => {
    const state = get();
    return {
      joy: state.joy,
      stress: state.stress,
      affection: state.affection,
      fatigue: state.fatigue,
      momentum: state.momentum,
      overwhelm: state.overwhelm,
      resilience: state.resilience,
      encouragement_need: state.encouragement_need,
    };
  },

  dailyReset: () => {
    set((state) => ({
      momentum: clamp(state.momentum * 0.6), // 40% decay
      stress: clamp(state.stress * 0.8),     // 20% reduction
      fatigue: clamp(state.fatigue * 0.75),  // 25% reduction
      resilience: clamp(state.resilience + 10), // +10 resilience
    }));
    get().syncToSupabase();
  },

  loadFromProfile: (memory) => {
    set({
      joy: memory.joy || 50,
      stress: memory.stress || 50,
      affection: memory.affection || 50,
      fatigue: memory.fatigue || 50,
      momentum: memory.momentum || 50,
      overwhelm: memory.overwhelm || 50,
      resilience: memory.resilience || 50,
      encouragement_need: memory.encouragement_need || 50,
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
      momentum: state.momentum,
      overwhelm: state.overwhelm,
      resilience: state.resilience,
      encouragement_need: state.encouragement_need,
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
    const state = useEmotionalMemory.getState();
    state.adjustJoy(2);
    state.adjustStress(-1);
    state.applyMomentum(3);
    state.applyOverwhelm(-2);
    
    // Build resilience on completion
    if (state.snapshot().stress > 60) {
      state.applyStress(-2); // Extra stress reduction
      state.recover();
    }
  },
  
  TASK_ADDED_OVERWHELMING: () => {
    const state = useEmotionalMemory.getState();
    state.adjustStress(3);
    state.applyOverwhelm(2);
    
    // Check if user needs encouragement
    const snapshot = state.snapshot();
    if (snapshot.overwhelm > 70 || snapshot.stress > 70) {
      state.applyStress(5); // Increase encouragement need via state method
    }
  },
  
  TASK_STREAK: (count: number) => {
    const state = useEmotionalMemory.getState();
    state.adjustJoy(count * 2);
    state.applyMomentum(count * 3);
    state.applyOverwhelm(-count);
  },
  
  POSITIVE_INTERACTION: () => {
    useEmotionalMemory.getState().adjustAffection(4);
  },
  
  INACTIVITY_CHECK: () => {
    useEmotionalMemory.getState().checkInactivity();
  },
  
  RECOVER: () => {
    useEmotionalMemory.getState().recover();
  },
} as const;

// Start inactivity checker (call once in main app)
export const startEmotionalMemoryMonitoring = () => {
  // Check inactivity every hour
  const inactivityInterval = setInterval(() => {
    EMOTIONAL_EVENTS.INACTIVITY_CHECK();
  }, 60 * 60 * 1000);

  // Sync to Supabase periodically
  const syncInterval = setInterval(() => {
    useEmotionalMemory.getState().syncToSupabase();
  }, 60 * 60 * 1000);
  
  // Return cleanup function
  return () => {
    clearInterval(inactivityInterval);
    clearInterval(syncInterval);
  };
};
