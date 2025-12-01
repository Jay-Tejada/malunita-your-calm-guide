import { create } from "zustand";

interface CompanionVisibilityState {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
}

export const useCompanionVisibility = create<CompanionVisibilityState>((set) => ({
  isVisible: true,
  show: () => set({ isVisible: true }),
  hide: () => set({ isVisible: false }),
}));
