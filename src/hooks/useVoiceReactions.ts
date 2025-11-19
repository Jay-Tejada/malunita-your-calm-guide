import { useState, useEffect, useRef, useCallback } from 'react';
import { PersonalityType } from './useCompanionIdentity';

export type VoiceReactionState = 
  | 'idle' 
  | 'listening' 
  | 'thinking' 
  | 'speaking' 
  | 'misheard' 
  | 'nameMention'
  | 'stress-detected'
  | 'urgency-detected'
  | 'uncertainty-detected'
  | 'confidence-detected'
  | 'end-confirmation';

export type IntensityLevel = 'whisper' | 'normal' | 'loud' | 'excited';

interface ReactionConfig {
  leanAngle: number;
  haloIntensity: number;
  pulseSpeed: number;
  expansionAmount: number;
  colorShift?: string;
}

interface SemanticCues {
  stress: string[];
  uncertainty: string[];
  urgency: string[];
  clarity: string[];
}

const SEMANTIC_KEYWORDS: SemanticCues = {
  stress: ['overwhelmed', 'stressed', 'too much', 'exhausted', 'burnout', 'tired', 'anxious', 'worry', 'struggling'],
  uncertainty: ['maybe', 'i think', 'not sure', 'probably', 'might', 'perhaps', 'possibly', 'unsure', 'confused'],
  urgency: ['today', 'asap', 'urgent', 'deadline', 'immediately', 'now', 'quick', 'fast', 'hurry', 'rush'],
  clarity: ['the plan is', 'i need to', 'definitely', 'clearly', 'obviously', 'exactly', 'specifically', 'certain', 'sure'],
};

const personalityReactionConfigs: Record<PersonalityType, Record<VoiceReactionState, ReactionConfig>> = {
  zen: {
    idle: { leanAngle: 0, haloIntensity: 1, pulseSpeed: 3000, expansionAmount: 0 },
    listening: { leanAngle: 3, haloIntensity: 1.4, pulseSpeed: 2500, expansionAmount: 0.02 },
    thinking: { leanAngle: 0, haloIntensity: 1.2, pulseSpeed: 3500, expansionAmount: 0.01 },
    speaking: { leanAngle: 0, haloIntensity: 1.3, pulseSpeed: 1800, expansionAmount: 0.03 },
    misheard: { leanAngle: 5, haloIntensity: 0.7, pulseSpeed: 2000, expansionAmount: 0 },
    nameMention: { leanAngle: 2, haloIntensity: 1.8, pulseSpeed: 800, expansionAmount: 0.05 },
    'stress-detected': { leanAngle: 0, haloIntensity: 1.5, pulseSpeed: 3500, expansionAmount: 0.01, colorShift: 'hsl(200, 70%, 60%)' },
    'urgency-detected': { leanAngle: 4, haloIntensity: 1.7, pulseSpeed: 1200, expansionAmount: 0.04, colorShift: 'hsl(45, 100%, 65%)' },
    'uncertainty-detected': { leanAngle: 6, haloIntensity: 1.3, pulseSpeed: 2800, expansionAmount: 0.02 },
    'confidence-detected': { leanAngle: 0, haloIntensity: 1.6, pulseSpeed: 2000, expansionAmount: 0.02 },
    'end-confirmation': { leanAngle: 0, haloIntensity: 1.4, pulseSpeed: 1500, expansionAmount: 0.03 },
  },
  spark: {
    idle: { leanAngle: 0, haloIntensity: 1, pulseSpeed: 2000, expansionAmount: 0 },
    listening: { leanAngle: 5, haloIntensity: 1.6, pulseSpeed: 1500, expansionAmount: 0.04 },
    thinking: { leanAngle: 0, haloIntensity: 1.3, pulseSpeed: 2200, expansionAmount: 0.02 },
    speaking: { leanAngle: 0, haloIntensity: 1.5, pulseSpeed: 1200, expansionAmount: 0.05 },
    misheard: { leanAngle: 7, haloIntensity: 0.6, pulseSpeed: 1500, expansionAmount: 0 },
    nameMention: { leanAngle: 3, haloIntensity: 2, pulseSpeed: 600, expansionAmount: 0.08 },
    'stress-detected': { leanAngle: 0, haloIntensity: 1.6, pulseSpeed: 3000, expansionAmount: 0.02, colorShift: 'hsl(200, 70%, 60%)' },
    'urgency-detected': { leanAngle: 6, haloIntensity: 1.9, pulseSpeed: 800, expansionAmount: 0.06, colorShift: 'hsl(45, 100%, 65%)' },
    'uncertainty-detected': { leanAngle: 8, haloIntensity: 1.4, pulseSpeed: 2200, expansionAmount: 0.03 },
    'confidence-detected': { leanAngle: 0, haloIntensity: 1.7, pulseSpeed: 1400, expansionAmount: 0.04 },
    'end-confirmation': { leanAngle: 0, haloIntensity: 1.6, pulseSpeed: 1000, expansionAmount: 0.05 },
  },
  cosmo: {
    idle: { leanAngle: 0, haloIntensity: 1, pulseSpeed: 2800, expansionAmount: 0 },
    listening: { leanAngle: 4, haloIntensity: 1.5, pulseSpeed: 2000, expansionAmount: 0.03 },
    thinking: { leanAngle: 0, haloIntensity: 1.25, pulseSpeed: 3000, expansionAmount: 0.015 },
    speaking: { leanAngle: 0, haloIntensity: 1.4, pulseSpeed: 1500, expansionAmount: 0.04 },
    misheard: { leanAngle: 6, haloIntensity: 0.65, pulseSpeed: 1800, expansionAmount: 0 },
    nameMention: { leanAngle: 2.5, haloIntensity: 1.9, pulseSpeed: 700, expansionAmount: 0.06 },
    'stress-detected': { leanAngle: 0, haloIntensity: 1.55, pulseSpeed: 3200, expansionAmount: 0.015, colorShift: 'hsl(200, 70%, 60%)' },
    'urgency-detected': { leanAngle: 5, haloIntensity: 1.8, pulseSpeed: 1000, expansionAmount: 0.05, colorShift: 'hsl(45, 100%, 65%)' },
    'uncertainty-detected': { leanAngle: 7, haloIntensity: 1.35, pulseSpeed: 2500, expansionAmount: 0.025 },
    'confidence-detected': { leanAngle: 0, haloIntensity: 1.65, pulseSpeed: 1700, expansionAmount: 0.03 },
    'end-confirmation': { leanAngle: 0, haloIntensity: 1.5, pulseSpeed: 1200, expansionAmount: 0.04 },
  },
};

const intensityToVisualParams = (intensity: IntensityLevel) => {
  switch (intensity) {
    case 'whisper':
      return { haloMultiplier: 0.8, pulseSpeedMultiplier: 1.3, expansionMultiplier: 0.5 };
    case 'normal':
      return { haloMultiplier: 1, pulseSpeedMultiplier: 1, expansionMultiplier: 1 };
    case 'loud':
      return { haloMultiplier: 1.3, pulseSpeedMultiplier: 0.7, expansionMultiplier: 1.5 };
    case 'excited':
      return { haloMultiplier: 1.6, pulseSpeedMultiplier: 0.5, expansionMultiplier: 2 };
  }
};

const detectIntensity = (audioLevel: number): IntensityLevel => {
  if (audioLevel < 0.2) return 'whisper';
  if (audioLevel < 0.5) return 'normal';
  if (audioLevel < 0.8) return 'loud';
  return 'excited';
};

const detectSemanticCue = (text: string): VoiceReactionState | null => {
  const lowerText = text.toLowerCase();
  
  if (SEMANTIC_KEYWORDS.stress.some(keyword => lowerText.includes(keyword))) {
    return 'stress-detected';
  }
  
  if (SEMANTIC_KEYWORDS.urgency.some(keyword => lowerText.includes(keyword))) {
    return 'urgency-detected';
  }
  
  if (SEMANTIC_KEYWORDS.uncertainty.some(keyword => lowerText.includes(keyword))) {
    return 'uncertainty-detected';
  }
  
  if (SEMANTIC_KEYWORDS.clarity.some(keyword => lowerText.includes(keyword))) {
    return 'confidence-detected';
  }
  
  return null;
};

export interface VoiceReactionsHook {
  reactionState: VoiceReactionState;
  config: ReactionConfig;
  audioLevel: number;
  intensityLevel: IntensityLevel;
  rhythmOffset: number;
  setListening: (level?: number, text?: string) => void;
  setThinking: () => void;
  setSpeaking: (speaking: boolean) => void;
  setMisheard: () => void;
  triggerNameMention: () => void;
  triggerEndConfirmation: () => void;
  detectSemanticCues: (text: string) => void;
  resetToIdle: () => void;
}

export const useVoiceReactions = (
  personality: PersonalityType = 'zen',
  companionName?: string
): VoiceReactionsHook => {
  const [reactionState, setReactionState] = useState<VoiceReactionState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [intensityLevel, setIntensityLevel] = useState<IntensityLevel>('normal');
  const [rhythmOffset, setRhythmOffset] = useState(0);
  const stateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rhythmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioUpdateRef = useRef<number>(Date.now());
  const pauseDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const baseConfig = personalityReactionConfigs[personality][reactionState];
  
  const visualParams = intensityToVisualParams(intensityLevel);
  const config: ReactionConfig = {
    ...baseConfig,
    haloIntensity: baseConfig.haloIntensity * visualParams.haloMultiplier,
    pulseSpeed: baseConfig.pulseSpeed * visualParams.pulseSpeedMultiplier,
    expansionAmount: baseConfig.expansionAmount * visualParams.expansionMultiplier,
  };

  const clearStateTimeout = () => {
    if (stateTimeoutRef.current) {
      clearTimeout(stateTimeoutRef.current);
      stateTimeoutRef.current = null;
    }
  };

  const clearRhythmAnimation = () => {
    if (rhythmIntervalRef.current) {
      clearInterval(rhythmIntervalRef.current);
      rhythmIntervalRef.current = null;
    }
  };

  const clearPauseDetection = () => {
    if (pauseDetectionTimeoutRef.current) {
      clearTimeout(pauseDetectionTimeoutRef.current);
      pauseDetectionTimeoutRef.current = null;
    }
  };

  const startRhythmMirroring = useCallback(() => {
    clearRhythmAnimation();
    
    rhythmIntervalRef.current = setInterval(() => {
      const offset = Math.sin(Date.now() / 200) * audioLevel * 2;
      setRhythmOffset(offset);
    }, 50);
  }, [audioLevel]);

  const detectPause = useCallback(() => {
    clearPauseDetection();
    
    pauseDetectionTimeoutRef.current = setTimeout(() => {
      if (reactionState === 'listening') {
        clearRhythmAnimation();
        setRhythmOffset(0);
      }
    }, 500);
  }, [reactionState]);

  const setListening = useCallback((level?: number, text?: string) => {
    clearStateTimeout();
    
    if (text) {
      const semanticState = detectSemanticCue(text);
      if (semanticState) {
        setReactionState(semanticState);
        
        stateTimeoutRef.current = setTimeout(() => {
          setReactionState('listening');
        }, 2000);
        
        return;
      }
    }
    
    setReactionState('listening');
    
    if (level !== undefined) {
      setAudioLevel(level);
      setIntensityLevel(detectIntensity(level));
      lastAudioUpdateRef.current = Date.now();
      
      if (level > 0.1) {
        startRhythmMirroring();
      }
      
      detectPause();
    } else {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      
      audioLevelIntervalRef.current = setInterval(() => {
        const simLevel = Math.random() * 0.5 + 0.3;
        setAudioLevel(simLevel);
        setIntensityLevel(detectIntensity(simLevel));
      }, 100);
    }
  }, [startRhythmMirroring, detectPause]);

  const detectSemanticCues = useCallback((text: string) => {
    const semanticState = detectSemanticCue(text);
    if (semanticState && reactionState === 'listening') {
      setReactionState(semanticState);
      
      clearStateTimeout();
      stateTimeoutRef.current = setTimeout(() => {
        setReactionState('listening');
      }, 1500);
    }
  }, [reactionState]);

  const setThinking = useCallback(() => {
    clearStateTimeout();
    clearRhythmAnimation();
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    setAudioLevel(0);
    setRhythmOffset(0);
    setReactionState('thinking');
  }, []);

  const setSpeaking = useCallback((speaking: boolean) => {
    if (speaking) {
      clearStateTimeout();
      clearRhythmAnimation();
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }
      setAudioLevel(0);
      setRhythmOffset(0);
      setReactionState('speaking');
    } else {
      setReactionState('idle');
      setAudioLevel(0);
      setRhythmOffset(0);
    }
  }, []);

  const setMisheard = useCallback(() => {
    clearStateTimeout();
    clearRhythmAnimation();
    setRhythmOffset(0);
    setReactionState('misheard');
    
    stateTimeoutRef.current = setTimeout(() => {
      setReactionState('idle');
      setAudioLevel(0);
      setIntensityLevel('normal');
      setRhythmOffset(0);
    }, 2000);
  }, []);

  const triggerNameMention = useCallback(() => {
    const previousState = reactionState;
    setReactionState('nameMention');
    clearRhythmAnimation();
    setRhythmOffset(0);
    
    stateTimeoutRef.current = setTimeout(() => {
      setReactionState(previousState);
    }, 1200);
  }, [reactionState]);

  const triggerEndConfirmation = useCallback(() => {
    clearStateTimeout();
    clearRhythmAnimation();
    setRhythmOffset(0);
    setReactionState('end-confirmation');
    
    stateTimeoutRef.current = setTimeout(() => {
      setReactionState('idle');
      setAudioLevel(0);
      setIntensityLevel('normal');
      setRhythmOffset(0);
    }, 1000);
  }, []);

  const resetToIdle = useCallback(() => {
    clearStateTimeout();
    clearRhythmAnimation();
    clearPauseDetection();
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    setAudioLevel(0);
    setIntensityLevel('normal');
    setRhythmOffset(0);
    setReactionState('idle');
  }, []);

  useEffect(() => {
    return () => {
      clearStateTimeout();
      clearRhythmAnimation();
      clearPauseDetection();
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
    };
  }, []);

  return {
    reactionState,
    config,
    audioLevel,
    intensityLevel,
    rhythmOffset,
    setListening,
    setThinking,
    setSpeaking,
    setMisheard,
    triggerNameMention,
    triggerEndConfirmation,
    detectSemanticCues,
    resetToIdle,
  };
};
