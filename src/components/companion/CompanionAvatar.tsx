import { useState, useEffect } from 'react';
import { useCompanionIdleBehavior } from '@/lib/companion/useCompanionIdleBehavior';
import babyHappyWebp from '@/assets/companions/baby-happy.webp';
import babyHappyPng from '@/assets/companions/baby-happy.png';
import babyNeutralWebp from '@/assets/companions/baby-neutral.webp';
import babyNeutralPng from '@/assets/companions/baby-neutral.png';
import babySleepyWebp from '@/assets/companions/baby-sleepy.webp';
import babySleepyPng from '@/assets/companions/baby-sleepy.png';
import babyListeningWebp from '@/assets/companions/baby-listening.webp';
import babyListeningPng from '@/assets/companions/baby-listening.png';

export type CompanionMode = 
  | 'idle' 
  | 'listening' 
  | 'thinking' 
  | 'celebrating' 
  | 'sleeping';

export type SpecialAnimation = 'celebrate' | 'spin' | 'peek' | null;

type CompanionExpression = 
  | 'baby_happy' 
  | 'baby_neutral' 
  | 'baby_sleepy' 
  | 'baby_listening';

interface CompanionAvatarProps {
  mode?: CompanionMode;
  lastEvent?: string | null;
  specialAnimation?: SpecialAnimation;
  onSpecialAnimationEnd?: () => void;
}

// Mode → Expression mapping
const getModeExpression = (mode: CompanionMode): CompanionExpression => {
  switch (mode) {
    case 'celebrating':
      return 'baby_happy';
    case 'listening':
      return 'baby_listening';
    case 'sleeping':
      return 'baby_sleepy';
    case 'thinking':
    case 'idle':
    default:
      return 'baby_neutral';
  }
};

// Asset mapping with WebP/PNG fallback
const getAssetForExpression = (expression: CompanionExpression) => {
  switch (expression) {
    case 'baby_happy':
      return { webp: babyHappyWebp, png: babyHappyPng };
    case 'baby_neutral':
      return { webp: babyNeutralWebp, png: babyNeutralPng };
    case 'baby_sleepy':
      return { webp: babySleepyWebp, png: babySleepyPng };
    case 'baby_listening':
      return { webp: babyListeningWebp, png: babyListeningPng };
  }
};

export const CompanionAvatar = ({
  mode = 'idle',
  lastEvent = null,
  specialAnimation = null,
  onSpecialAnimationEnd,
}: CompanionAvatarProps) => {
  const [currentExpression, setCurrentExpression] = useState<CompanionExpression>('baby_neutral');
  const [isPlayingSpecial, setIsPlayingSpecial] = useState(false);

  // Idle behavior system - only when mode is 'idle'
  const isActive = mode !== 'idle';
  const { currentIdleAnimation } = useCompanionIdleBehavior({
    isActive,
    userMood: null, // Can be passed in from props later
  });

  // Update expression when mode changes
  useEffect(() => {
    const newExpression = getModeExpression(mode);
    setCurrentExpression(newExpression);
  }, [mode]);

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

  const assets = getAssetForExpression(currentExpression);
  const animationClasses = getAnimationClasses();

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
      <picture>
        <source srcSet={assets.webp} type="image/webp" />
        <img
          src={assets.png}
          alt="Malunita companion"
          className="w-[140px] sm:w-[180px] md:w-[240px] lg:w-[260px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          style={{ background: 'transparent' }}
          draggable={false}
        />
      </picture>
    </div>
  );
};
