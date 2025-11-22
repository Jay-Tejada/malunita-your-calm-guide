import { useState, useEffect, useRef } from 'react';

export type IdleAnimation = 
  | 'idle_breathe' 
  | 'idle_blink' 
  | 'idle_float' 
  | 'idle_tilt' 
  | 'idle_look_left' 
  | 'idle_look_right'
  | 'idle_sleepy';

interface UseCompanionIdleBehaviorProps {
  isActive: boolean; // Whether companion is actively doing something
  userMood?: string | null;
}

export const useCompanionIdleBehavior = ({ 
  isActive, 
  userMood 
}: UseCompanionIdleBehaviorProps) => {
  const [currentIdleAnimation, setCurrentIdleAnimation] = useState<IdleAnimation>('idle_breathe');
  const recentAnimations = useRef<IdleAnimation[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Available idle animations with weights
  const getIdleAnimations = (): { animation: IdleAnimation; weight: number }[] => {
    const baseAnimations = [
      { animation: 'idle_breathe' as IdleAnimation, weight: 3 },
      { animation: 'idle_blink' as IdleAnimation, weight: 4 },
      { animation: 'idle_float' as IdleAnimation, weight: 2 },
      { animation: 'idle_tilt' as IdleAnimation, weight: 2 },
      { animation: 'idle_look_left' as IdleAnimation, weight: 1 },
      { animation: 'idle_look_right' as IdleAnimation, weight: 1 },
    ];

    // Add sleepy animation if user mood is tired
    if (userMood === 'tired' || userMood === 'sleepy') {
      baseAnimations.push({ animation: 'idle_sleepy', weight: 5 });
    }

    return baseAnimations;
  };

  // Select random idle animation avoiding recent repeats
  const selectNextAnimation = (): IdleAnimation => {
    const availableAnimations = getIdleAnimations();
    
    // Filter out recently used animations (last 3)
    const filtered = availableAnimations.filter(
      anim => !recentAnimations.current.slice(-3).includes(anim.animation)
    );

    // If all animations have been used recently, use all
    const options = filtered.length > 0 ? filtered : availableAnimations;

    // Weighted random selection
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;

    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option.animation;
      }
    }

    return options[0].animation;
  };

  // Trigger next idle animation
  const triggerNextIdle = () => {
    const nextAnimation = selectNextAnimation();
    
    // Update recent animations history
    recentAnimations.current = [...recentAnimations.current.slice(-2), nextAnimation];
    
    setCurrentIdleAnimation(nextAnimation);
    
    // Schedule next animation between 12-25 seconds
    const delay = 12000 + Math.random() * 13000;
    timerRef.current = setTimeout(triggerNextIdle, delay);
  };

  // Start idle behavior when inactive
  useEffect(() => {
    if (!isActive) {
      // Start first idle animation after 2-5 seconds
      const initialDelay = 2000 + Math.random() * 3000;
      timerRef.current = setTimeout(triggerNextIdle, initialDelay);
    } else {
      // Clear timer when active
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setCurrentIdleAnimation('idle_breathe');
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, userMood]);

  return {
    currentIdleAnimation,
  };
};
