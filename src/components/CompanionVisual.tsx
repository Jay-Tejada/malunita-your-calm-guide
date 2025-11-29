import { useState, useEffect } from 'react';
import { companionAssets, emotionToVisualState, motionToVisualState } from '@/lib/companionAssets';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedImage } from '@/components/OptimizedImage';
import { getLQIP } from '@/lib/imageOptimization';
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
  const [memoryProfile, setMemoryProfile] = useState<any>(null);

  // Fetch memory profile to shape personality
  useEffect(() => {
    const fetchMemoryProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('ai_memory_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setMemoryProfile(data);
      }
    };

    fetchMemoryProfile();
  }, []);
  
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

  // Animation class based on motion state and memory profile
  const getAnimationClass = () => {
    let baseAnimation = '';
    
    switch (motion) {
      case 'excited':
      case 'fiesta':
        baseAnimation = 'animate-bounce-excited';
        break;
      case 'curious':
        baseAnimation = 'animate-sway-curious';
        break;
      case 'sleepy':
        baseAnimation = 'animate-float-sleepy';
        break;
      case 'idle':
      default:
        baseAnimation = 'animate-float-idle';
    }

    // Adjust animation intensity based on memory profile
    if (memoryProfile) {
      const positiveReinforcers = memoryProfile.positive_reinforcers || [];
      const emotionalTriggers = memoryProfile.emotional_triggers || [];
      const energyPattern = memoryProfile.energy_pattern || {};

      // If user likes positive reinforcement → more expressive animations
      const hasPositivePreference = positiveReinforcers.length > 5;
      const isPositiveEmotion = ['excited', 'proud', 'inspired', 'encouraging'].includes(emotion);
      
      if (hasPositivePreference && isPositiveEmotion && motion === 'excited') {
        return `${baseAnimation} brightness-110`;
      }

      // If user avoids sad cues → subdued animations for negative emotions
      const avoidsSadness = emotionalTriggers.some((t: any) => 
        t.trigger?.includes('stress') || t.trigger?.includes('overwhelm')
      );
      
      if (avoidsSadness && ['overwhelmed', 'sleepy'].includes(emotion)) {
        return `${baseAnimation} opacity-80`;
      }

      // If user prefers calm → reduce jittery motions
      const prefersCalm = energyPattern.night > 0.6 || energyPattern.evening > 0.6;
      
      if (prefersCalm && ['excited', 'curious'].includes(motion)) {
        return 'animate-float-idle'; // Use calmer animation
      }
    }

    return baseAnimation;
  };

  const animationClass = getAnimationClass();

  // Get LQIP for smooth loading
  const placeholder = getLQIP(assetSrc);
  
  // Preload current companion image for instant display
  const shouldPreload = emotion !== 'neutral';

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${className} ${animationClass}`}
    >
      <OptimizedImage
        src={assetSrc}
        alt="Malunita companion"
        placeholder={placeholder}
        preload={shouldPreload}
        className="object-contain drop-shadow-lg"
      />
    </div>
  );
};
