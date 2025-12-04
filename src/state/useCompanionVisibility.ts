import { create } from "zustand";

interface CompanionVisibilityState {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
}

export const useCompanionVisibility = create<CompanionVisibilityState>((set) => ({
  isVisible: false,
  show: () => set({ isVisible: true }),
  hide: () => set({ isVisible: false }),
}));
