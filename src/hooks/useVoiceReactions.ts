import { useState, useEffect, useRef, useCallback } from 'react';
import { PersonalityType } from './useCompanionIdentity';

export type VoiceReactionState = 
  | 'idle' 
  | 'listening' 
  | 'thinking' 
  | 'speaking' 
  | 'misheard' 
  | 'nameMention';

interface ReactionConfig {
  leanAngle: number;
  haloIntensity: number;
  pulseSpeed: number;
  expansionAmount: number;
}

const personalityReactionConfigs: Record<PersonalityType, Record<VoiceReactionState, ReactionConfig>> = {
  zen: {
    idle: { leanAngle: 0, haloIntensity: 1, pulseSpeed: 3000, expansionAmount: 0 },
    listening: { leanAngle: 3, haloIntensity: 1.4, pulseSpeed: 2500, expansionAmount: 0.02 },
    thinking: { leanAngle: 0, haloIntensity: 1.2, pulseSpeed: 3500, expansionAmount: 0.01 },
    speaking: { leanAngle: 0, haloIntensity: 1.3, pulseSpeed: 1800, expansionAmount: 0.03 },
    misheard: { leanAngle: 5, haloIntensity: 0.7, pulseSpeed: 2000, expansionAmount: 0 },
    nameMention: { leanAngle: 2, haloIntensity: 1.8, pulseSpeed: 800, expansionAmount: 0.05 },
  },
  spark: {
    idle: { leanAngle: 0, haloIntensity: 1, pulseSpeed: 2000, expansionAmount: 0 },
    listening: { leanAngle: 5, haloIntensity: 1.6, pulseSpeed: 1500, expansionAmount: 0.04 },
    thinking: { leanAngle: 0, haloIntensity: 1.3, pulseSpeed: 2200, expansionAmount: 0.02 },
    speaking: { leanAngle: 0, haloIntensity: 1.5, pulseSpeed: 1200, expansionAmount: 0.05 },
    misheard: { leanAngle: 7, haloIntensity: 0.6, pulseSpeed: 1500, expansionAmount: 0 },
    nameMention: { leanAngle: 3, haloIntensity: 2, pulseSpeed: 600, expansionAmount: 0.08 },
  },
  cosmo: {
    idle: { leanAngle: 0, haloIntensity: 1, pulseSpeed: 2800, expansionAmount: 0 },
    listening: { leanAngle: 4, haloIntensity: 1.5, pulseSpeed: 2000, expansionAmount: 0.03 },
    thinking: { leanAngle: 0, haloIntensity: 1.25, pulseSpeed: 3000, expansionAmount: 0.015 },
    speaking: { leanAngle: 0, haloIntensity: 1.4, pulseSpeed: 1500, expansionAmount: 0.04 },
    misheard: { leanAngle: 6, haloIntensity: 0.65, pulseSpeed: 1800, expansionAmount: 0 },
    nameMention: { leanAngle: 2.5, haloIntensity: 1.9, pulseSpeed: 700, expansionAmount: 0.06 },
  },
};

export interface VoiceReactionsHook {
  reactionState: VoiceReactionState;
  config: ReactionConfig;
  audioLevel: number;
  setListening: (level?: number) => void;
  setThinking: () => void;
  setSpeaking: (speaking: boolean) => void;
  setMisheard: () => void;
  triggerNameMention: () => void;
  resetToIdle: () => void;
}

export const useVoiceReactions = (
  personality: PersonalityType = 'zen',
  companionName?: string
): VoiceReactionsHook => {
  const [reactionState, setReactionState] = useState<VoiceReactionState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const stateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const config = personalityReactionConfigs[personality][reactionState];

  // Clear any pending state timeouts
  const clearStateTimeout = () => {
    if (stateTimeoutRef.current) {
      clearTimeout(stateTimeoutRef.current);
      stateTimeoutRef.current = null;
    }
  };

  // Listening state with optional audio level tracking
  const setListening = useCallback((level?: number) => {
    clearStateTimeout();
    setReactionState('listening');
    
    if (level !== undefined) {
      setAudioLevel(level);
    } else {
      // Simulate audio levels if not provided
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      
      audioLevelIntervalRef.current = setInterval(() => {
        setAudioLevel(Math.random() * 0.5 + 0.3); // 0.3-0.8
      }, 100);
    }
  }, []);

  // Thinking state
  const setThinking = useCallback(() => {
    clearStateTimeout();
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    setAudioLevel(0);
    setReactionState('thinking');
  }, []);

  // Speaking state
  const setSpeaking = useCallback((speaking: boolean) => {
    clearStateTimeout();
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    
    if (speaking) {
      setReactionState('speaking');
      // Simulate speaking pulse
      audioLevelIntervalRef.current = setInterval(() => {
        setAudioLevel(Math.random() * 0.4 + 0.4); // 0.4-0.8
      }, 200);
    } else {
      setAudioLevel(0);
      setReactionState('idle');
    }
  }, []);

  // Misheard state (temporary)
  const setMisheard = useCallback(() => {
    clearStateTimeout();
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    setAudioLevel(0);
    setReactionState('misheard');
    
    stateTimeoutRef.current = setTimeout(() => {
      setReactionState('idle');
    }, 2000);
  }, []);

  // Name mention reaction (temporary burst)
  const triggerNameMention = useCallback(() => {
    clearStateTimeout();
    const previousState = reactionState;
    setReactionState('nameMention');
    
    stateTimeoutRef.current = setTimeout(() => {
      setReactionState(previousState);
    }, 1500);
  }, [reactionState]);

  // Reset to idle
  const resetToIdle = useCallback(() => {
    clearStateTimeout();
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    setAudioLevel(0);
    setReactionState('idle');
  }, []);

  // Detect companion name mentions in transcribed text
  useEffect(() => {
    // This would be triggered externally when text is transcribed
    // For now, it's just a hook setup
  }, [companionName]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearStateTimeout();
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
    };
  }, []);

  return {
    reactionState,
    config,
    audioLevel,
    setListening,
    setThinking,
    setSpeaking,
    setMisheard,
    triggerNameMention,
    resetToIdle,
  };
};
