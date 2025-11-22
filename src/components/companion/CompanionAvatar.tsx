import { useState, useEffect } from 'react';
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

  // Get animation class based on special animation
  const getAnimationClass = (): string => {
    if (!isPlayingSpecial || !specialAnimation) return '';
    
    switch (specialAnimation) {
      case 'celebrate':
        return 'companion-special-celebrate';
      case 'spin':
        return 'companion-special-spin';
      case 'peek':
        return 'companion-special-peek';
      default:
        return '';
    }
  };

  const assets = getAssetForExpression(currentExpression);
  const animationClass = getAnimationClass();

  return (
    <div 
      className={`
        relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64
        flex items-center justify-center
      `}
    >
      {/* Drop shadow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-foreground/10 rounded-full blur-md" />
      
      {/* Companion Image with WebP/PNG fallback */}
      <div 
        className={`
          relative w-full h-full flex items-center justify-center
          ${animationClass}
          transition-opacity duration-150
        `}
      >
        <picture className="w-full h-full">
          <source srcSet={assets.webp} type="image/webp" />
          <img
            src={assets.png}
            alt="Malunita companion"
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
          />
        </picture>
      </div>
    </div>
  );
};
