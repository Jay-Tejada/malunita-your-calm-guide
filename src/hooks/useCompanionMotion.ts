import { useState, useEffect, useRef } from 'react';
import { PersonalityType } from './useCompanionIdentity';

export type MotionState = 'idle' | 'curious' | 'excited' | 'calm' | 'sleepy' | 'fiesta';

interface MotionConfig {
  floatDuration: number;
  blinkInterval: number;
  transitionSpeed: number;
}

const personalityMotionConfigs: Record<PersonalityType, MotionConfig> = {
  zen: {
    floatDuration: 6000, // Slow, peaceful
    blinkInterval: 22000, // Less frequent
    transitionSpeed: 1200,
  },
  spark: {
    floatDuration: 3500, // Quick, energetic
    blinkInterval: 15000, // More frequent
    transitionSpeed: 600,
  },
  cosmo: {
    floatDuration: 5000, // Smooth, mystical
    blinkInterval: 20000, // Moderate
    transitionSpeed: 900,
  },
};

export interface CompanionMotionHook {
  motionState: MotionState;
  shouldBlink: boolean;
  tiltAngle: number;
  config: MotionConfig;
  triggerCurious: () => void;
  triggerExcited: () => void;
  triggerCalm: () => void;
  triggerFiesta: () => void;
  resetToIdle: () => void;
}

export const useCompanionMotion = (
  personality: PersonalityType = 'zen',
  isActive: boolean = false
): CompanionMotionHook => {
  const [motionState, setMotionState] = useState<MotionState>('idle');
  const [shouldBlink, setShouldBlink] = useState(false);
  const [tiltAngle, setTiltAngle] = useState(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const config = personalityMotionConfigs[personality];

  // Blink animation
  useEffect(() => {
    const startBlinking = () => {
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
      }

      const scheduleNextBlink = () => {
        // Random variation: ±20%
        const variance = config.blinkInterval * 0.2;
        const delay = config.blinkInterval + (Math.random() - 0.5) * variance;
        
        blinkIntervalRef.current = setTimeout(() => {
          setShouldBlink(true);
          setTimeout(() => setShouldBlink(false), 800); // Blink duration
          scheduleNextBlink();
        }, delay);
      };

      scheduleNextBlink();
    };

    if (motionState !== 'sleepy') {
      startBlinking();
    }

    return () => {
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
      }
    };
  }, [motionState, config.blinkInterval]);

  // Inactivity → Sleepy mode
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      lastActivityRef.current = Date.now();

      if (motionState === 'sleepy') {
        setMotionState('idle');
      }

      // After 90 seconds of inactivity, go sleepy
      inactivityTimerRef.current = setTimeout(() => {
        if (!isActive && motionState === 'idle') {
          setMotionState('sleepy');
        }
      }, 90000);
    };

    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isActive, motionState]);

  // Activity detection
  useEffect(() => {
    if (isActive) {
      lastActivityRef.current = Date.now();
      if (motionState === 'sleepy') {
        setMotionState('idle');
      }
    }
  }, [isActive, motionState]);

  // Trigger functions
  const triggerCurious = () => {
    clearTimers();
    setMotionState('curious');
    setTiltAngle(5 + Math.random() * 5); // 5-10 degrees
    lastActivityRef.current = Date.now();

    stateTimeoutRef.current = setTimeout(() => {
      setMotionState('idle');
      setTiltAngle(0);
    }, 2000);
  };

  const triggerExcited = () => {
    clearTimers();
    setMotionState('excited');
    lastActivityRef.current = Date.now();

    stateTimeoutRef.current = setTimeout(() => {
      setMotionState('idle');
    }, 2500);
  };

  const triggerCalm = () => {
    clearTimers();
    setMotionState('calm');
    setTiltAngle(0);
    lastActivityRef.current = Date.now();

    stateTimeoutRef.current = setTimeout(() => {
      setMotionState('idle');
    }, 5000);
  };

  const triggerFiesta = () => {
    clearTimers();
    setMotionState('fiesta');
    lastActivityRef.current = Date.now();
    // Fiesta state must be manually reset
  };

  const resetToIdle = () => {
    clearTimers();
    setMotionState('idle');
    setTiltAngle(0);
    lastActivityRef.current = Date.now();
  };

  const clearTimers = () => {
    if (stateTimeoutRef.current) {
      clearTimeout(stateTimeoutRef.current);
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimers();
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
      }
    };
  }, []);

  return {
    motionState,
    shouldBlink,
    tiltAngle,
    config,
    triggerCurious,
    triggerExcited,
    triggerCalm,
    triggerFiesta,
    resetToIdle,
  };
};
