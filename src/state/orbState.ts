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

export interface OrbPalette {
  base: string;
  glow: string;
  accent: string;
}

export interface OrbState {
  mood: OrbMood;
  energy: OrbEnergy;
  stage: number;
  streak: number;
  isAnimating: boolean;
  glowColor: string;
  palette: OrbPalette;
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

const defaultPalette: OrbPalette = {
  base: '#F5F0E6',
  glow: 'rgba(245, 240, 230, 0.4)',
  accent: '#E8E0D5'
};

export const useOrbStore = create<OrbState & OrbActions>((set) => ({
  // State
  mood: "idle",
  energy: 3,
  stage: 1,
  streak: 0,
  isAnimating: false,
  glowColor: "#F5F0E6",
  palette: defaultPalette,
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
    let mood: OrbMood;
    let glowColor: string;
    let palette: OrbPalette;

    if (hour >= 5 && hour < 8) {
      // Dawn
      mood = 'morning';
      glowColor = '#FFF5E6';
      palette = { base: '#FFF5E6', glow: 'rgba(255, 220, 180, 0.4)', accent: '#FFE4C4' };
    } else if (hour >= 8 && hour < 12) {
      // Morning
      mood = 'morning';
      glowColor = '#FFFEF5';
      palette = { base: '#FFFEF5', glow: 'rgba(255, 255, 240, 0.3)', accent: '#F5F5DC' };
    } else if (hour >= 12 && hour < 17) {
      // Midday
      mood = 'idle';
      glowColor = '#F5F0E6';
      palette = { base: '#F5F0E6', glow: 'rgba(245, 240, 230, 0.35)', accent: '#E8E0D5' };
    } else if (hour >= 17 && hour < 20) {
      // Dusk
      mood = 'evening';
      glowColor = '#F0E6E0';
      palette = { base: '#F0E6E0', glow: 'rgba(220, 180, 160, 0.3)', accent: '#E0D0C8' };
    } else {
      // Night
      mood = 'evening';
      glowColor = '#E6E8F0';
      palette = { base: '#E0E4EE', glow: 'rgba(180, 190, 220, 0.25)', accent: '#C8D0E0' };
    }

    set({ mood, glowColor, palette });
  },
  
  evolve: () => set((state) => ({ 
    stage: Math.min(state.stage + 1, 7),
    mood: "evolving",
    isAnimating: true 
  })),
  
  reset: () => set({ mood: "idle", energy: 3, isAnimating: false, palette: defaultPalette })
}));
