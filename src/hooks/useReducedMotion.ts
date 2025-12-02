import { useState, useEffect } from 'react';
import { useIsMobile } from './useIsMobile';

/**
 * Hook to detect if reduced motion should be used
 * Returns true if:
 * - User prefers reduced motion (system setting)
 * - User is on mobile (performance optimization)
 */
export const useReducedMotion = () => {
  const isMobile = useIsMobile();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Reduce animations on mobile for performance
  const shouldReduceMotion = prefersReducedMotion || isMobile;

  return {
    prefersReducedMotion,
    shouldReduceMotion,
    // Utility to conditionally apply animation classes
    animationClass: (className: string) => shouldReduceMotion ? '' : className,
  };
};
