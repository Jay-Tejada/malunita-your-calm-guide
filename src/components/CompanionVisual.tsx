import { companionAssets, emotionToVisualState, motionToVisualState } from '@/lib/companionAssets';
import type { EmotionState } from '@/hooks/useCompanionEmotion';
import type { MotionState } from '@/hooks/useCompanionMotion';

interface CompanionVisualProps {
  emotion?: EmotionState;
  motion?: MotionState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CompanionVisual = ({ 
  emotion = 'neutral', 
  motion = 'idle',
  size = 'md',
  className = '' 
}: CompanionVisualProps) => {
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  // Determine which asset to use based on emotion or motion
  const visualState = emotion !== 'neutral' 
    ? emotionToVisualState(emotion)
    : motionToVisualState(motion);

  const assetSrc = companionAssets[visualState];

  // Animation class based on motion state
  const getAnimationClass = () => {
    switch (motion) {
      case 'excited':
      case 'fiesta':
        return 'animate-bounce-excited';
      case 'curious':
        return 'animate-sway-curious';
      case 'sleepy':
        return 'animate-float-sleepy';
      case 'idle':
      default:
        return 'animate-float-idle';
    }
  };

  const animationClass = getAnimationClass();

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${className} ${animationClass}`}
    >
      <img 
        src={assetSrc} 
        alt="Malunita companion"
        className="w-full h-full object-contain drop-shadow-lg"
      />
    </div>
  );
};
