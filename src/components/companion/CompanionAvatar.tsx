import { useState, useEffect, memo } from 'react';
import { useCompanionIdleBehavior } from '@/lib/companion/useCompanionIdleBehavior';
import { CreatureSprite } from '@/components/CreatureSprite';
import { useMoodStore, type Mood } from '@/state/moodMachine';

export type CompanionMode = 
  | 'idle' 
  | 'listening' 
  | 'thinking' 
  | 'celebrating' 
  | 'sleeping';

export type SpecialAnimation = 'celebrate' | 'spin' | 'peek' | null;

interface CompanionAvatarProps {
  mode?: CompanionMode;
  lastEvent?: string | null;
  specialAnimation?: SpecialAnimation;
  onSpecialAnimationEnd?: () => void;
}

export const CompanionAvatar = memo(function CompanionAvatar({
  mode = 'idle',
  lastEvent = null,
  specialAnimation = null,
  onSpecialAnimationEnd,
}: CompanionAvatarProps) {
  const [isPlayingSpecial, setIsPlayingSpecial] = useState(false);
  
  // Get current mood from store
  const mood = useMoodStore((state) => state.mood);

  // Idle behavior system - only when mode is 'idle'
  const isActive = mode !== 'idle';
  const { currentIdleAnimation } = useCompanionIdleBehavior({
    isActive,
    userMood: null,
  });

  // Handle special animations
  useEffect(() => {
    if (specialAnimation) {
      setIsPlayingSpecial(true);
      
      // Animation duration in ms
      const duration = 600;
      
      setTimeout(() => {
        setIsPlayingSpecial(false);
        onSpecialAnimationEnd?.();
      }, duration);
    }
  }, [specialAnimation, onSpecialAnimationEnd]);

  // Get animation classes (combining special, mode, and idle)
  const getAnimationClasses = (): string => {
    const classes: string[] = [];

    // Special animations take priority
    if (isPlayingSpecial && specialAnimation) {
      switch (specialAnimation) {
        case 'celebrate':
          classes.push('companion-special-celebrate');
          break;
        case 'spin':
          classes.push('companion-special-spin');
          break;
        case 'peek':
          classes.push('companion-special-peek');
          break;
      }
      return classes.join(' ');
    }

    // Mode-specific animations
    if (mode === 'listening') {
      classes.push('companion-mode-listening');
    } else if (mode === 'thinking') {
      classes.push('companion-mode-thinking');
    } else if (mode === 'sleeping') {
      classes.push('companion-mode-sleeping');
    }

    // Idle animations (only when in idle mode and no special animations)
    if (mode === 'idle' && !isPlayingSpecial) {
      switch (currentIdleAnimation) {
        case 'idle_breathe':
          classes.push('companion-idle-breathe');
          break;
        case 'idle_float':
          classes.push('companion-idle-float');
          break;
        case 'idle_blink':
          classes.push('companion-idle-blink');
          break;
        case 'idle_tilt':
          classes.push('companion-idle-tilt');
          break;
        case 'idle_look_left':
          classes.push('companion-idle-look-left');
          break;
        case 'idle_look_right':
          classes.push('companion-idle-look-right');
          break;
        case 'idle_sleepy':
          classes.push('companion-idle-sleepy');
          break;
      }
    }

    return classes.join(' ');
  };

  const animationClasses = getAnimationClasses();
  
  // Map mode to mood override (mode takes priority over base mood)
  const getEffectiveMood = (): Mood => {
    // Mode-based overrides
    if (mode === 'celebrating') return 'overjoyed';
    if (mode === 'sleeping') return 'sleeping';
    if (mode === 'listening') return 'welcoming';
    if (mode === 'thinking') return 'concerned';
    
    // Otherwise use the current mood from store (with safety fallback)
    return mood || 'neutral';
  };
  
  const effectiveMood = getEffectiveMood();

  return (
    <div 
      className={`
        relative
        flex flex-col items-center justify-center
        select-none
        ${animationClasses}
      `}
      style={{
        width: 'auto',
        height: 'auto',
        background: 'transparent',
      }}
    >
      <CreatureSprite
        emotion={effectiveMood}
        size={240}
        animate={mode === 'idle'}
        className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
      />
    </div>
  );
});
