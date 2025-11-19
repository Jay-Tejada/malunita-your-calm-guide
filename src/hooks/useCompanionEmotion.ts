import { useState, useEffect, useRef } from 'react';
import { PersonalityType } from './useCompanionIdentity';
import { MotionState } from './useCompanionMotion';

export type EmotionState = 
  | 'neutral' 
  | 'curious' 
  | 'focused' 
  | 'proud' 
  | 'calm' 
  | 'sleepy' 
  | 'excited' 
  | 'encouraging';

interface EmotionConfig {
  glowIntensity: number; // 0-1
  pulseSpeed: number; // ms
  colorShift: number; // 0-1, how much to shift from base color
  motionIntensity: number; // 0-1
}

const personalityEmotionConfigs: Record<
  PersonalityType,
  Record<EmotionState, EmotionConfig>
> = {
  zen: {
    neutral: { glowIntensity: 0.5, pulseSpeed: 4000, colorShift: 0, motionIntensity: 0.5 },
    curious: { glowIntensity: 0.6, pulseSpeed: 3500, colorShift: 0.1, motionIntensity: 0.6 },
    focused: { glowIntensity: 0.7, pulseSpeed: 3000, colorShift: 0.2, motionIntensity: 0.4 },
    proud: { glowIntensity: 0.8, pulseSpeed: 2500, colorShift: 0.3, motionIntensity: 0.7 },
    calm: { glowIntensity: 0.4, pulseSpeed: 5000, colorShift: 0, motionIntensity: 0.3 },
    sleepy: { glowIntensity: 0.2, pulseSpeed: 6000, colorShift: -0.1, motionIntensity: 0.2 },
    excited: { glowIntensity: 0.9, pulseSpeed: 2000, colorShift: 0.4, motionIntensity: 0.8 },
    encouraging: { glowIntensity: 0.7, pulseSpeed: 2800, colorShift: 0.2, motionIntensity: 0.6 },
  },
  spark: {
    neutral: { glowIntensity: 0.6, pulseSpeed: 2500, colorShift: 0, motionIntensity: 0.6 },
    curious: { glowIntensity: 0.7, pulseSpeed: 2000, colorShift: 0.2, motionIntensity: 0.7 },
    focused: { glowIntensity: 0.8, pulseSpeed: 1800, colorShift: 0.3, motionIntensity: 0.5 },
    proud: { glowIntensity: 0.95, pulseSpeed: 1500, colorShift: 0.4, motionIntensity: 0.9 },
    calm: { glowIntensity: 0.5, pulseSpeed: 3000, colorShift: 0, motionIntensity: 0.4 },
    sleepy: { glowIntensity: 0.3, pulseSpeed: 4000, colorShift: -0.1, motionIntensity: 0.3 },
    excited: { glowIntensity: 1, pulseSpeed: 1200, colorShift: 0.5, motionIntensity: 1 },
    encouraging: { glowIntensity: 0.85, pulseSpeed: 1600, colorShift: 0.3, motionIntensity: 0.8 },
  },
  cosmo: {
    neutral: { glowIntensity: 0.55, pulseSpeed: 3500, colorShift: 0, motionIntensity: 0.55 },
    curious: { glowIntensity: 0.65, pulseSpeed: 3000, colorShift: 0.15, motionIntensity: 0.65 },
    focused: { glowIntensity: 0.75, pulseSpeed: 2700, colorShift: 0.25, motionIntensity: 0.45 },
    proud: { glowIntensity: 0.9, pulseSpeed: 2200, colorShift: 0.35, motionIntensity: 0.8 },
    calm: { glowIntensity: 0.45, pulseSpeed: 4500, colorShift: 0, motionIntensity: 0.35 },
    sleepy: { glowIntensity: 0.25, pulseSpeed: 5500, colorShift: -0.1, motionIntensity: 0.25 },
    excited: { glowIntensity: 0.95, pulseSpeed: 1800, colorShift: 0.45, motionIntensity: 0.9 },
    encouraging: { glowIntensity: 0.8, pulseSpeed: 2400, colorShift: 0.25, motionIntensity: 0.7 },
  },
};

// Map emotions to motion states
const emotionToMotionMap: Record<EmotionState, MotionState> = {
  neutral: 'idle',
  curious: 'curious',
  focused: 'idle',
  proud: 'excited',
  calm: 'calm',
  sleepy: 'sleepy',
  excited: 'excited',
  encouraging: 'curious',
};

export interface CompanionEmotionHook {
  emotion: EmotionState;
  config: EmotionConfig;
  suggestedMotion: MotionState;
  setEmotion: (emotion: EmotionState) => void;
  triggerEmotionFromContext: (context: EmotionContext) => void;
}

export interface EmotionContext {
  taskCount?: number;
  taskStreak?: number;
  isReflecting?: boolean;
  isVoiceActive?: boolean;
  lastActivityMinutesAgo?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  rapidTaskCreation?: boolean;
}

export const useCompanionEmotion = (
  personality: PersonalityType = 'zen'
): CompanionEmotionHook => {
  const [emotion, setEmotion] = useState<EmotionState>('neutral');
  const emotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  const config = personalityEmotionConfigs[personality][emotion];
  const suggestedMotion = emotionToMotionMap[emotion];

  // Auto-detect time of day and adjust emotion baseline
  useEffect(() => {
    const hour = new Date().getHours();
    let timeOfDay: EmotionContext['timeOfDay'];
    
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Subtle baseline adjustment based on time
    if (timeOfDay === 'night' && emotion === 'neutral') {
      setEmotion('calm');
    }
  }, [emotion]);

  // Auto-return to neutral after emotion duration
  const triggerTemporaryEmotion = (newEmotion: EmotionState, duration: number = 5000) => {
    if (emotionTimeoutRef.current) {
      clearTimeout(emotionTimeoutRef.current);
    }

    setEmotion(newEmotion);
    lastActivityRef.current = new Date();

    emotionTimeoutRef.current = setTimeout(() => {
      setEmotion('neutral');
    }, duration);
  };

  const triggerEmotionFromContext = (context: EmotionContext) => {
    const {
      taskCount = 0,
      taskStreak = 0,
      isReflecting = false,
      isVoiceActive = false,
      lastActivityMinutesAgo = 0,
      rapidTaskCreation = false,
    } = context;

    // Priority-based emotion selection
    if (lastActivityMinutesAgo > 90) {
      setEmotion('sleepy');
      return;
    }

    if (lastActivityMinutesAgo > 60 && lastActivityMinutesAgo <= 90) {
      triggerTemporaryEmotion('encouraging', 8000);
      return;
    }

    if (isReflecting) {
      triggerTemporaryEmotion('calm', 10000);
      return;
    }

    if (isVoiceActive) {
      triggerTemporaryEmotion('curious', 3000);
      return;
    }

    if (rapidTaskCreation) {
      triggerTemporaryEmotion('focused', 6000);
      return;
    }

    if (taskStreak >= 5) {
      triggerTemporaryEmotion('excited', 7000);
      return;
    }

    if (taskStreak >= 3) {
      triggerTemporaryEmotion('proud', 5000);
      return;
    }

    if (taskCount > 10) {
      triggerTemporaryEmotion('proud', 4000);
      return;
    }

    if (taskCount > 5) {
      triggerTemporaryEmotion('focused', 3000);
      return;
    }

    // Default to neutral if no conditions met
    setEmotion('neutral');
  };

  useEffect(() => {
    return () => {
      if (emotionTimeoutRef.current) {
        clearTimeout(emotionTimeoutRef.current);
      }
    };
  }, []);

  return {
    emotion,
    config,
    suggestedMotion,
    setEmotion,
    triggerEmotionFromContext,
  };
};
