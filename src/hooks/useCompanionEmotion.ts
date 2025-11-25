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
  | 'overwhelmed'
  | 'gentle'
  | 'supportive'
  | 'concerned'
  | 'calming'
  | 'energetic';

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
  energetic: 'ambitious',
  calm: 'medium',
  neutral: 'medium',
  focused: 'medium',
  curious: 'medium',
  encouraging: 'medium',
  supportive: 'medium',
  gentle: 'simple',
  overwhelmed: 'simple',
  concerned: 'simple',
  calming: 'simple',
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
    gentle: { glowIntensity: 0.45, pulseSpeed: 4500, colorShift: 0.05, motionIntensity: 0.35 },
    supportive: { glowIntensity: 0.65, pulseSpeed: 3200, colorShift: 0.15, motionIntensity: 0.55 },
    concerned: { glowIntensity: 0.4, pulseSpeed: 4800, colorShift: -0.1, motionIntensity: 0.3 },
    calming: { glowIntensity: 0.3, pulseSpeed: 5500, colorShift: -0.05, motionIntensity: 0.25 },
    energetic: { glowIntensity: 0.95, pulseSpeed: 1800, colorShift: 0.45, motionIntensity: 0.9 },
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
    gentle: { glowIntensity: 0.5, pulseSpeed: 3500, colorShift: 0.1, motionIntensity: 0.4 },
    supportive: { glowIntensity: 0.75, pulseSpeed: 2200, colorShift: 0.25, motionIntensity: 0.65 },
    concerned: { glowIntensity: 0.45, pulseSpeed: 3800, colorShift: -0.15, motionIntensity: 0.35 },
    calming: { glowIntensity: 0.35, pulseSpeed: 4200, colorShift: -0.05, motionIntensity: 0.3 },
    energetic: { glowIntensity: 1, pulseSpeed: 1400, colorShift: 0.5, motionIntensity: 0.95 },
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
    gentle: { glowIntensity: 0.48, pulseSpeed: 4000, colorShift: 0.08, motionIntensity: 0.38 },
    supportive: { glowIntensity: 0.72, pulseSpeed: 2800, colorShift: 0.2, motionIntensity: 0.6 },
    concerned: { glowIntensity: 0.42, pulseSpeed: 4300, colorShift: -0.12, motionIntensity: 0.32 },
    calming: { glowIntensity: 0.32, pulseSpeed: 4800, colorShift: -0.08, motionIntensity: 0.27 },
    energetic: { glowIntensity: 0.97, pulseSpeed: 1600, colorShift: 0.48, motionIntensity: 0.92 },
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
  gentle: 'calm',
  supportive: 'curious',
  concerned: 'calm',
  calming: 'calm',
  energetic: 'excited',
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
  isStormDay?: boolean;
  burnoutRisk?: number;
  focusStreak?: number;
  unlocksCount?: number;
  autoFocusTriggered?: boolean;
}

export const useCompanionEmotion = (
  personality: PersonalityType = 'zen',
  archetype?: PersonalityArchetype
): CompanionEmotionHook => {
  const [emotion, setEmotion] = useState<EmotionState>('neutral');
  const [memoryProfile, setMemoryProfile] = useState<any>(null);
  const emotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // Fetch memory profile on mount
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

  // Adjust emotion config based on memory profile
  const getAdjustedConfig = (): EmotionConfig => {
    const baseConfig = personalityEmotionConfigs[personality][emotion];
    if (!memoryProfile) return baseConfig;

    const adjustedConfig = { ...baseConfig };

    // If user likes positive reinforcement → increase cheerful animations
    const positiveReinforcers = memoryProfile.positive_reinforcers || [];
    const hasPositivePreference = positiveReinforcers.length > 5;
    
    if (hasPositivePreference && ['proud', 'excited', 'inspired', 'encouraging'].includes(emotion)) {
      adjustedConfig.glowIntensity = Math.min(1, adjustedConfig.glowIntensity * 1.2);
      adjustedConfig.motionIntensity = Math.min(1, adjustedConfig.motionIntensity * 1.15);
      adjustedConfig.pulseSpeed = Math.max(1000, adjustedConfig.pulseSpeed * 0.85);
    }

    // If user avoids sad cues → reduce sad expressions
    const emotionalTriggers = memoryProfile.emotional_triggers || [];
    const avoidsSadness = emotionalTriggers.some((t: any) => 
      t.trigger?.includes('stress') || t.trigger?.includes('overwhelm')
    );
    
    if (avoidsSadness && ['overwhelmed', 'sleepy'].includes(emotion)) {
      adjustedConfig.motionIntensity = Math.max(0.1, adjustedConfig.motionIntensity * 0.7);
      adjustedConfig.glowIntensity = Math.max(0.2, adjustedConfig.glowIntensity * 0.8);
    }

    // If user interacts often → increase expressiveness
    const lastUpdated = memoryProfile.last_updated ? new Date(memoryProfile.last_updated) : null;
    const daysSinceUpdate = lastUpdated 
      ? (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24) 
      : 30;
    
    if (daysSinceUpdate < 2) { // Updated recently = high interaction
      adjustedConfig.glowIntensity = Math.min(1, adjustedConfig.glowIntensity * 1.1);
      adjustedConfig.motionIntensity = Math.min(1, adjustedConfig.motionIntensity * 1.1);
    }

    // If user prefers calm → reduce jittery motions
    const energyPattern = memoryProfile.energy_pattern || {};
    const prefersCalm = energyPattern.night > 0.6 || energyPattern.evening > 0.6;
    
    if (prefersCalm) {
      adjustedConfig.motionIntensity = Math.max(0.2, adjustedConfig.motionIntensity * 0.8);
      adjustedConfig.pulseSpeed = Math.max(3000, adjustedConfig.pulseSpeed * 1.2);
    }

    return adjustedConfig;
  };

  const config = getAdjustedConfig();
  const suggestedMotion = emotionToMotionMap[emotion];
  const taskPreference = emotionToTaskPreference[emotion];

  // Check burnout, storms, and streaks to adjust emotion intelligently with DEEP REASONING
  useEffect(() => {
    const checkIntelligentContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('burnout_recovery_until, burnout_risk')
        .eq('id', user.id)
        .single();

      // Check burnout recovery mode (HIGHEST PRIORITY)
      const inRecoveryMode = profile?.burnout_recovery_until 
        ? new Date(profile.burnout_recovery_until) > new Date()
        : false;

      if (inRecoveryMode) {
        // During burnout recovery, shift to calm/supportive tone
        setEmotion('calm');
        return;
      }

      // Check if burnout risk is high but not in recovery yet (WARNING)
      if (profile?.burnout_risk && profile.burnout_risk >= 0.5) {
        setEmotion('overwhelmed');
        return;
      }

      // Check focus streak (ENCOURAGEMENT)
      const { data: streakData } = await supabase
        .from('focus_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentStreak = streakData?.current_streak || 0;
      if (currentStreak >= 3) {
        setEmotion('proud');
        return;
      }

      // Check for upcoming storm day (PREEMPTIVE FOCUS)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      const { data: stormData } = await supabase
        .from('priority_storms')
        .select('expected_load_score')
        .eq('user_id', user.id)
        .eq('date', tomorrowDate)
        .maybeSingle();

      if (stormData && stormData.expected_load_score >= 60) {
        setEmotion('focused');
        return;
      }

      // Check current ONE thing's unlocks count (MOTIVATION)
      const today = new Date().toISOString().split('T')[0];
      const { data: focusTasks } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('is_focus', true)
        .eq('focus_date', today)
        .maybeSingle();

      if (focusTasks) {
        const { data: embeddingData } = await supabase
          .from('focus_embeddings')
          .select('unlocks_count')
          .eq('user_id', user.id)
          .eq('task_id', focusTasks.id)
          .maybeSingle();

        const unlocksCount = embeddingData?.unlocks_count || 0;
        if (unlocksCount >= 3) {
          setEmotion('inspired');
          return;
        }
      }

      // Auto-detect time of day and adjust emotion baseline
      const hour = new Date().getHours();
      let timeOfDay: EmotionContext['timeOfDay'];
      
      if (hour >= 6 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
      else timeOfDay = 'night';

      // Use DEEP REASONING to determine optimal emotion transition
      try {
        const reasoningInput = `Given this companion context, what emotion should Malunita express?

Current state:
- Time: ${timeOfDay}
- Burnout risk: ${profile?.burnout_risk || 0}
- Focus streak: ${currentStreak}
- Storm tomorrow: ${stormData ? 'yes, load ' + stormData.expected_load_score : 'no'}
- Current emotion: ${emotion}
${focusTasks ? `- ONE thing: ${focusTasks.title}` : '- No ONE thing set'}

Available emotions: neutral, curious, focused, proud, calm, sleepy, excited, encouraging, inspired, overwhelmed

What is the most supportive emotion for Malunita to express right now?`;

        const { data: deepData, error: deepError } = await supabase.functions.invoke('long-reasoning', {
          body: {
            input: reasoningInput,
            context: {
              timeOfDay,
              burnoutRisk: profile?.burnout_risk || 0,
              focusStreak: currentStreak,
              hasStorm: !!stormData,
              currentEmotion: emotion
            }
          }
        });

        if (!deepError && deepData?.final_answer) {
          const suggestedEmotion = deepData.final_answer.toLowerCase();
          const emotionMatch = suggestedEmotion.match(/\b(neutral|curious|focused|proud|calm|sleepy|excited|encouraging|inspired|overwhelmed)\b/);
          
          if (emotionMatch) {
            const newEmotion = emotionMatch[0] as EmotionState;
            console.log('✨ Deep reasoning suggested emotion:', newEmotion);
            setEmotion(newEmotion);
            return;
          }
        }
      } catch (error) {
        console.error('Error applying deep reasoning to emotion:', error);
      }

      // Fallback: Subtle baseline adjustment based on time
      if (timeOfDay === 'night' && emotion === 'neutral') {
        setEmotion('calm');
      }
    };

    checkIntelligentContext();
    
    // Re-check every 5 minutes
    const interval = setInterval(checkIntelligentContext, 5 * 60 * 1000);
    return () => clearInterval(interval);
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
        gentle: 'neutral',
        supportive: 'welcoming',
        concerned: 'concerned',
        calming: 'neutral',
        energetic: 'excited',
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
      isStormDay = false,
      burnoutRisk = 0,
      focusStreak = 0,
      unlocksCount = 0,
      autoFocusTriggered = false,
    } = context;

    // HIGHEST PRIORITY: Burnout signals
    if (burnoutRisk >= 0.6) {
      triggerTemporaryEmotion('overwhelmed', 12000);
      return;
    }

    if (burnoutRisk >= 0.5) {
      triggerTemporaryEmotion('calm', 10000);
      return;
    }

    // AutoFocus triggered - show reassuring emotion
    if (autoFocusTriggered) {
      triggerTemporaryEmotion('encouraging', 10000);
      return;
    }

    // Storm day prediction - show preemptive focus
    if (isStormDay) {
      triggerTemporaryEmotion('focused', 10000);
      return;
    }

    // Focus streak - show pride
    if (focusStreak >= 5) {
      triggerTemporaryEmotion('excited', 9000);
      return;
    }

    if (focusStreak >= 3) {
      triggerTemporaryEmotion('proud', 7000);
      return;
    }

    // High unlocks count - show motivation
    if (unlocksCount >= 5) {
      triggerTemporaryEmotion('inspired', 8000);
      return;
    }

    if (unlocksCount >= 3) {
      triggerTemporaryEmotion('excited', 6000);
      return;
    }

    // Existing conditions
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
