import { create } from 'zustand';
import type { EvolutionStage } from '@/lib/evolutionAssets';

type CutsceneType = 
  | { type: 'evolution'; stage: EvolutionStage }
  | { type: 'levelup'; level: number }
  | { type: 'ritual'; ritualType: 'morning' | 'evening' }
  | null;

interface CutsceneManagerState {
  activeCutscene: CutsceneType;
  showEvolutionCutscene: (stage: EvolutionStage) => void;
  showLevelUpCutscene: (level: number) => void;
  showRitualCutscene: (ritualType: 'morning' | 'evening') => void;
  dismissCutscene: () => void;
}

export const useCutsceneManager = create<CutsceneManagerState>((set) => ({
  activeCutscene: null,

  showEvolutionCutscene: (stage) => {
    set({ activeCutscene: { type: 'evolution', stage } });
  },

  showLevelUpCutscene: (level) => {
    set({ activeCutscene: { type: 'levelup', level } });
  },

  showRitualCutscene: (ritualType) => {
    set({ activeCutscene: { type: 'ritual', ritualType } });
  },

  dismissCutscene: () => {
    set({ activeCutscene: null });
  },
}));
