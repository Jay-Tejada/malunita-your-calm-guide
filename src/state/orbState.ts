import { create } from 'zustand';
import { celebrationHaptic, focusHaptic } from '@/lib/haptics';

export type OrbMood = 
  | "idle"
  | "thinking"
  | "celebrating"
  | "focused"
  | "morning"
  | "evening"
  | "evolving";

export type OrbEnergy = 1 | 2 | 3 | 4 | 5;

export interface OrbState {
  mood: OrbMood;
  energy: OrbEnergy;
  stage: number;
  streak: number;
  isAnimating: boolean;
  glowColor: string;
  lastTrigger: string | null;
}

interface OrbActions {
  setMood: (mood: OrbMood) => void;
  setEnergy: (energy: OrbEnergy) => void;
  triggerCelebration: () => void;
  triggerThinking: () => void;
  enterFocusMode: () => void;
  exitFocusMode: () => void;
  setTimeOfDay: (hour: number) => void;
  evolve: () => void;
  reset: () => void;
}

export const useOrbStore = create<OrbState & OrbActions>((set) => ({
  // State
  mood: "idle",
  energy: 3,
  stage: 1,
  streak: 0,
  isAnimating: false,
  glowColor: "#F5F0E6",
  lastTrigger: null,

  // Actions
  setMood: (mood) => set({ mood, lastTrigger: mood }),
  
  setEnergy: (energy) => set({ energy }),
  
  triggerCelebration: () => {
    celebrationHaptic();
    set({ mood: "celebrating", isAnimating: true });
    setTimeout(() => set({ mood: "idle", isAnimating: false }), 1500);
  },
  
  triggerThinking: () => {
    set({ mood: "thinking", isAnimating: true });
  },
  
  enterFocusMode: () => {
    focusHaptic();
    set({ mood: "focused", energy: 4 });
  },
  
  exitFocusMode: () => set({ mood: "idle", energy: 3 }),
  
  setTimeOfDay: (hour) => {
    if (hour >= 5 && hour < 12) {
      set({ mood: "morning", glowColor: "#FFF5E6" });
    } else if (hour >= 18 || hour < 5) {
      set({ mood: "evening", glowColor: "#E6E8F0" });
    } else {
      set({ mood: "idle", glowColor: "#F5F0E6" });
    }
  },
  
  evolve: () => set((state) => ({ 
    stage: Math.min(state.stage + 1, 7),
    mood: "evolving",
    isAnimating: true 
  })),
  
  reset: () => set({ mood: "idle", energy: 3, isAnimating: false })
}));
