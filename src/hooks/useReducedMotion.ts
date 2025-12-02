import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

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

/**
 * Returns animation props for framer-motion components
 */
export const useAnimationConfig = () => {
  const { shouldReduceMotion, animationClass } = useReducedMotion();

  return {
    // Disable animations entirely for framer-motion
    animate: shouldReduceMotion ? false : undefined,
    
    // Simplified transition
    transition: shouldReduceMotion 
      ? { duration: 0 } 
      : { duration: 0.3, ease: 'easeOut' },
    
    // For conditional className usage
    animationClass,
    
    // Raw flag
    reduceMotion: shouldReduceMotion,
  };
};
