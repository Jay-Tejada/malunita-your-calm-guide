import { useState, useEffect, useRef } from 'react';
import { PersonalityType } from './useCompanionIdentity';
import { MotionState } from './useCompanionMotion';
import { CreatureExpression } from '@/constants/expressions';
import { PersonalityArchetype, getExpressionWeight } from '@/state/personality';
import { supabase } from '@/integrations/supabase/client';

export type EmotionState = 
  | 'neutral' 
  | 'curious' 
  | 'focused' 
  | 'proud' 
  | 'calm' 
  | 'sleepy' 
  | 'excited' 
  | 'encouraging'
  | 'inspired'
  | 'overwhelmed';

export type TaskSuggestionPreference = 
  | 'ambitious'      // Joyful/Excited → suggest challenging, impactful tasks
  | 'medium'         // Calm/Neutral → suggest balanced tasks
  | 'simple'         // Worried/Overwhelmed → suggest easy starter tasks
  | 'low-cognitive'; // Sleepy → suggest low-effort tasks

// Map emotions to task suggestion preferences
export const emotionToTaskPreference: Record<EmotionState, TaskSuggestionPreference> = {
  excited: 'ambitious',
  proud: 'ambitious',
  inspired: 'ambitious',
  calm: 'medium',
  neutral: 'medium',
  focused: 'medium',
  curious: 'medium',
  encouraging: 'medium',
  overwhelmed: 'simple',
  sleepy: 'low-cognitive',
};

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
    inspired: { glowIntensity: 0.85, pulseSpeed: 2600, colorShift: 0.35, motionIntensity: 0.65 },
    overwhelmed: { glowIntensity: 0.35, pulseSpeed: 5500, colorShift: -0.15, motionIntensity: 0.25 },
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
    inspired: { glowIntensity: 0.95, pulseSpeed: 1700, colorShift: 0.45, motionIntensity: 0.75 },
    overwhelmed: { glowIntensity: 0.4, pulseSpeed: 4500, colorShift: -0.2, motionIntensity: 0.3 },
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
    inspired: { glowIntensity: 0.88, pulseSpeed: 2300, colorShift: 0.4, motionIntensity: 0.7 },
    overwhelmed: { glowIntensity: 0.38, pulseSpeed: 5000, colorShift: -0.18, motionIntensity: 0.28 },
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
  inspired: 'curious',
  overwhelmed: 'calm',
};

export interface CompanionEmotionHook {
  emotion: EmotionState;
  config: EmotionConfig;
  suggestedMotion: MotionState;
  taskPreference: TaskSuggestionPreference;
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
  primaryFocusCreated?: boolean;
}

export const useCompanionEmotion = (
  personality: PersonalityType = 'zen',
  archetype?: PersonalityArchetype
): CompanionEmotionHook => {
  const [emotion, setEmotion] = useState<EmotionState>('neutral');
  const emotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  const config = personalityEmotionConfigs[personality][emotion];
  const suggestedMotion = emotionToMotionMap[emotion];
  const taskPreference = emotionToTaskPreference[emotion];

  // Check burnout recovery mode and adjust emotion
  useEffect(() => {
    const checkBurnoutAndAdjust = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('burnout_recovery_until')
        .eq('id', user.id)
        .single();

      const inRecoveryMode = profile?.burnout_recovery_until 
        ? new Date(profile.burnout_recovery_until) > new Date()
        : false;

      if (inRecoveryMode) {
        // During burnout recovery, shift to calm/supportive tone
        setEmotion('calm');
        return;
      }

      // Auto-detect time of day and adjust emotion baseline
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
    };

    checkBurnoutAndAdjust();
  }, [emotion]);

  // Auto-return to neutral after emotion duration
  const triggerTemporaryEmotion = (newEmotion: EmotionState, duration: number = 5000) => {
    // Apply personality archetype weighting to emotion selection
    if (archetype) {
      const emotionExpressionMap: Record<EmotionState, CreatureExpression> = {
        neutral: 'neutral',
        curious: 'surprised',
        focused: 'neutral',
        proud: 'happy',
        calm: 'neutral',
        sleepy: 'sleepy',
        excited: 'excited',
        encouraging: 'welcoming',
        inspired: 'overjoyed',
        overwhelmed: 'worried',
      };
      
      const expressionForEmotion = emotionExpressionMap[newEmotion];
      const weight = getExpressionWeight(archetype, expressionForEmotion);
      
      // If this emotion's expression is avoided by the archetype, reduce duration
      if (weight < 0.5) {
        duration = duration * 0.5;
      }
    }
    
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
    
    // Primary focus task created - show inspired emotion
    if (context.primaryFocusCreated) {
      triggerTemporaryEmotion('inspired', 8000);
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
    taskPreference,
    setEmotion,
    triggerEmotionFromContext,
  };
};
