import { useEffect } from 'react';
import { useOrbStore } from '@/state/orbState';

const moodToBackground: Record<string, string> = {
  idle: 'orb-bg-idle',
  morning: 'orb-bg-morning',
  evening: 'orb-bg-evening',
  focused: 'orb-bg-focused',
  celebrating: 'orb-bg-celebrating',
};

export function useOrbBackground() {
  const { mood } = useOrbStore();
  
  useEffect(() => {
    const bgClass = moodToBackground[mood] || 'orb-bg-idle';
    const root = document.documentElement;
    
    // Remove all orb-bg classes
    Object.values(moodToBackground).forEach(cls => {
      root.classList.remove(cls);
    });
    
    // Add current mood class
    root.classList.add(bgClass);
    
    return () => {
      root.classList.remove(bgClass);
    };
  }, [mood]);
}
