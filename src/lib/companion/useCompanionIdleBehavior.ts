import { useState, useEffect, useRef } from 'react';

export type IdleAnimation = 
  | 'breathe' 
  | 'blink' 
  | 'float' 
  | 'tilt_left' 
  | 'tilt_right' 
  | 'look_left' 
  | 'look_right';

interface UseCompanionIdleBehaviorProps {
  isActive: boolean; // Whether the companion is actively doing something
  userMood?: string | null;
}

export const useCompanionIdleBehavior = ({ 
  isActive, 
  userMood 
}: UseCompanionIdleBehaviorProps) => {
  const [currentIdleAnimation, setCurrentIdleAnimation] = useState<IdleAnimation>('breathe');
  const [isBlinking, setIsBlinking] = useState(false);
  const recentAnimations = useRef<IdleAnimation[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Available idle animations with weights
  const getIdleAnimations = (): { animation: IdleAnimation; weight: number }[] => {
    const baseAnimations = [
      { animation: 'breathe' as IdleAnimation, weight: 3 },
      { animation: 'blink' as IdleAnimation, weight: 4 },
      { animation: 'float' as IdleAnimation, weight: 2 },
      { animation: 'tilt_left' as IdleAnimation, weight: 1 },
      { animation: 'tilt_right' as IdleAnimation, weight: 1 },
      { animation: 'look_left' as IdleAnimation, weight: 1 },
      { animation: 'look_right' as IdleAnimation, weight: 1 },
    ];

    // Increase blink weight if user mood is tired
    if (userMood === 'tired' || userMood === 'sleepy') {
      return baseAnimations.map(anim => 
        anim.animation === 'blink' 
          ? { ...anim, weight: 8 }
          : anim
      );
    }

    return baseAnimations;
  };

  // Select random idle animation avoiding recent repeats
  const selectNextAnimation = (): IdleAnimation => {
    const availableAnimations = getIdleAnimations();
    
    // Filter out recently used animations
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

  // Separate blink trigger for random blinking
  const triggerRandomBlink = () => {
    setIsBlinking(true);
    
    // Blink duration
    setTimeout(() => {
      setIsBlinking(false);
    }, 150);
    
    // Schedule next blink between 3-8 seconds
    const delay = 3000 + Math.random() * 5000;
    blinkTimerRef.current = setTimeout(triggerRandomBlink, delay);
  };

  // Start idle behavior when inactive
  useEffect(() => {
    if (!isActive) {
      // Start first idle animation after 2-5 seconds
      const initialDelay = 2000 + Math.random() * 3000;
      timerRef.current = setTimeout(triggerNextIdle, initialDelay);
      
      // Start random blinking after 3-6 seconds
      const blinkDelay = 3000 + Math.random() * 3000;
      blinkTimerRef.current = setTimeout(triggerRandomBlink, blinkDelay);
    } else {
      // Clear timers when active
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (blinkTimerRef.current) {
        clearTimeout(blinkTimerRef.current);
        blinkTimerRef.current = null;
      }
      setIsBlinking(false);
      setCurrentIdleAnimation('breathe');
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, [isActive]);

  return {
    currentIdleAnimation,
    isBlinking,
  };
};
