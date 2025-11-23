import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { getEvolutionStage } from '@/lib/evolutionAssets';
import type { EvolutionStage } from '@/lib/evolutionAssets';

export interface LevelState {
  level: number;        // 1–20
  xp: number;           // total XP
  nextLevelXp: number;  // XP needed for next level
  evolutionStage: EvolutionStage; // 1-4
}

interface LevelActions {
  setLevel: (level: number) => void;
  setXp: (xp: number) => void;
  setEvolutionStage: (stage: EvolutionStage) => void;
  grantXp: (amount: number, userId?: string) => Promise<{ leveledUp: boolean; evolved: boolean }>;
  calculateNextLevelXp: (level: number) => number;
  loadFromProfile: (companionXp: number, companionStage: number) => void;
}

export const useLevelSystem = create<LevelState & LevelActions>((set, get) => ({
  level: 1,
  xp: 0,
  nextLevelXp: 120,
  evolutionStage: 1,

  setLevel: (level) => set({ level }),
  setXp: (xp) => set({ xp }),
  setEvolutionStage: (stage) => set({ evolutionStage: stage }),

  calculateNextLevelXp: (level) => {
    return Math.round(Math.pow(level, 1.8) * 120);
  },

  loadFromProfile: (companionXp: number, companionStage: number) => {
    const level = companionStage || 1;
    const xp = companionXp || 0;
    const nextLevelXp = get().calculateNextLevelXp(level);
    const evolutionStage = getEvolutionStage(level);
    set({ level, xp, nextLevelXp, evolutionStage });
  },

  grantXp: async (amount, userId) => {
    const state = get();
    let newXp = state.xp + amount;
    let newLevel = state.level;
    let nextLevelXp = state.nextLevelXp;
    const oldStage = state.evolutionStage;

    // Check for level up
    while (newXp >= nextLevelXp && newLevel < 20) {
      newLevel++;
      nextLevelXp = get().calculateNextLevelXp(newLevel);
    }

    const leveledUp = newLevel > state.level;
    
    // Check for evolution
    const newStage = getEvolutionStage(newLevel);
    const evolved = newStage > oldStage;

    // Update local state
    set({ 
      xp: newXp, 
      level: newLevel, 
      nextLevelXp,
      evolutionStage: newStage 
    });

    // Sync to Supabase
    if (userId) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            companion_xp: newXp,
            companion_stage: newLevel,
          })
          .eq('id', userId);

        if (error) {
          console.error('Failed to sync XP to profile:', error);
        }
      } catch (err) {
        console.error('Error syncing XP:', err);
      }
    }

    // Return level up and evolution status for external handling
    return { leveledUp, evolved };
  },
}));

// XP Rewards Constants
export const XP_REWARDS = {
  ADD_TASK: 5,
  COMPLETE_TASK: 12,
  COMPLETE_3_TASKS_BONUS: 20,
  DAILY_CHECKIN: 10,
  VOICE_ENTRY: 8,
  LONG_VOICE_SESSION: 15,
  TAP_INTERACTION: 3,
} as const;
