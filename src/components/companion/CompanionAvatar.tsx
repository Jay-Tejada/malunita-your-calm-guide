import { useState, useEffect } from 'react';
import { useCompanionIdleBehavior, IdleAnimation } from '@/lib/companion/useCompanionIdleBehavior';
import malunitaHappy from '@/assets/companions/malunita-happy.png';
import malunitaExcited from '@/assets/companions/malunita-excited.png';
import malunitaCalm from '@/assets/companions/malunita-calm.png';
import malunitaCurious from '@/assets/companions/malunita-curious.png';

export type CompanionMode = 
  | 'idle' 
  | 'listening' 
  | 'thinking' 
  | 'celebrating' 
  | 'sleeping';

export type SpecialAnimation = 'celebrate' | 'spin' | null;

interface CompanionAvatarProps {
  mode?: CompanionMode;
  lastEvent?: string | null;
  userMood?: string | null;
  specialAnimation?: SpecialAnimation;
  onSpecialAnimationEnd?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Expression mapping
const getModeExpression = (mode: CompanionMode): string => {
  switch (mode) {
    case 'celebrating':
      return 'happy';
    case 'listening':
      return 'excited'; // bottom_right - minimal/listening
    case 'sleeping':
      return 'calm'; // bottom_left - sleepy
    case 'thinking':
    case 'idle':
    default:
      return 'curious'; // top_right - neutral/curious
  }
};

// Asset mapping
const getAssetForExpression = (expression: string): string => {
  switch (expression) {
    case 'happy':
      return malunitaHappy; // top_left
    case 'excited':
      return malunitaExcited; // bottom_right
    case 'calm':
      return malunitaCalm; // bottom_left
    case 'curious':
    default:
      return malunitaCurious; // top_right
  }
};

export const CompanionAvatar = ({
  mode = 'idle',
  lastEvent,
  userMood,
  specialAnimation = null,
  onSpecialAnimationEnd,
  size = 'lg',
  className = '',
}: CompanionAvatarProps) => {
  const [currentExpression, setCurrentExpression] = useState('curious');
  const [isPlayingSpecial, setIsPlayingSpecial] = useState(false);

  // Idle behavior system
  const { currentIdleAnimation, isBlinking } = useCompanionIdleBehavior({
    isActive: mode !== 'idle',
    userMood,
  });

  // Size mapping
  const sizeClasses = {
    sm: 'w-32 h-32 sm:w-40 sm:h-40',
    md: 'w-40 h-40 sm:w-48 sm:h-48',
    lg: 'w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64',
    xl: 'w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80',
  };

  // Update expression based on mode
  useEffect(() => {
    const newExpression = getModeExpression(mode);
    setCurrentExpression(newExpression);
  }, [mode]);

  // Handle special animations
  useEffect(() => {
    if (specialAnimation) {
      setIsPlayingSpecial(true);
      
      const duration = specialAnimation === 'celebrate' ? 600 : 600;
      
      setTimeout(() => {
        setIsPlayingSpecial(false);
        onSpecialAnimationEnd?.();
      }, duration);
    }
  }, [specialAnimation, onSpecialAnimationEnd]);

  // Get animation classes
  const getAnimationClasses = (): string => {
    const classes: string[] = [];

    // Special animations take priority
    if (isPlayingSpecial) {
      if (specialAnimation === 'celebrate') {
        classes.push('companion-special-celebrate');
      } else if (specialAnimation === 'spin') {
        classes.push('companion-special-spin');
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

    // Idle animations (only when in idle mode)
    if (mode === 'idle') {
      switch (currentIdleAnimation) {
        case 'breathe':
          classes.push('companion-idle-breathe');
          break;
        case 'float':
          classes.push('companion-idle-float');
          break;
        case 'tilt_left':
          classes.push('companion-idle-tilt-left');
          break;
        case 'tilt_right':
          classes.push('companion-idle-tilt-right');
          break;
        case 'look_left':
          classes.push('companion-idle-look-left');
          break;
        case 'look_right':
          classes.push('companion-idle-look-right');
          break;
      }
    }

    // Blink state
    if (isBlinking) {
      classes.push('companion-blinking');
    }

    return classes.join(' ');
  };

  const assetSrc = getAssetForExpression(currentExpression);
  const animationClasses = getAnimationClasses();

  return (
    <div 
      className={`
        relative flex items-center justify-center
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Drop shadow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-foreground/10 rounded-full blur-md" />
      
      {/* Companion Image */}
      <div 
        className={`
          relative w-full h-full flex items-center justify-center
          ${animationClasses}
          transition-opacity duration-150
        `}
      >
        <img
          src={assetSrc}
          alt="Malunita companion"
          className="w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </div>
  );
};
