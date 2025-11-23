import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ArtStyleKey, DEFAULT_ART_STYLE } from './artStyleConfig';

interface ArtStyleState {
  currentStyle: ArtStyleKey;
  isTransitioning: boolean;
  setStyle: (style: ArtStyleKey) => void;
  setTransitioning: (transitioning: boolean) => void;
}

export const useArtStyleStore = create<ArtStyleState>()(
  persist(
    (set) => ({
      currentStyle: DEFAULT_ART_STYLE,
      isTransitioning: false,
      
      setStyle: (style: ArtStyleKey) => {
        set({ isTransitioning: true });
        
        // Transition animation duration
        setTimeout(() => {
          set({ currentStyle: style, isTransitioning: false });
        }, 300);
      },
      
      setTransitioning: (transitioning: boolean) => {
        set({ isTransitioning: transitioning });
      },
    }),
    {
      name: 'malunita-art-style',
    }
  )
);
