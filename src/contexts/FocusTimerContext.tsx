import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { hapticSuccess, hapticMedium } from '@/utils/haptics';

interface FocusTimerState {
  isRunning: boolean;
  isPaused: boolean;
  secondsRemaining: number;
  totalSeconds: number;
  currentTaskId: string | null;
  currentTaskTitle: string | null;
  sessionType: 'focus' | 'break' | 'rest';
}

interface FocusTimerContextValue extends FocusTimerState {
  startTimer: (minutes: number, taskId?: string, taskTitle?: string, type?: 'focus' | 'break' | 'rest') => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  addMinutes: (minutes: number) => void;
}

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null);

const STORAGE_KEY = 'malunita_focus_timer';

interface StoredTimerState {
  isRunning: boolean;
  isPaused: boolean;
  secondsRemaining: number;
  totalSeconds: number;
  currentTaskId: string | null;
  currentTaskTitle: string | null;
  sessionType: 'focus' | 'break' | 'rest';
  lastUpdated: number;
}

export function FocusTimerProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<FocusTimerState>(() => {
    // Restore from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredTimerState = JSON.parse(stored);
        // Calculate time elapsed since last update
        const elapsed = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
        
        if (parsed.isRunning && !parsed.isPaused) {
          const remaining = Math.max(0, parsed.secondsRemaining - elapsed);
          if (remaining > 0) {
            return {
              ...parsed,
              secondsRemaining: remaining,
            };
          }
          // Timer would have completed
          return {
            isRunning: false,
            isPaused: false,
            secondsRemaining: 0,
            totalSeconds: 0,
            currentTaskId: null,
            currentTaskTitle: null,
            sessionType: 'focus',
          };
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to restore timer state:', e);
    }
    
    return {
      isRunning: false,
      isPaused: false,
      secondsRemaining: 0,
      totalSeconds: 0,
      currentTaskId: null,
      currentTaskTitle: null,
      sessionType: 'focus',
    };
  });

  // Persist to localStorage
  useEffect(() => {
    const toStore: StoredTimerState = {
      ...state,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [state]);

  // Timer tick
  useEffect(() => {
    if (state.isRunning && !state.isPaused && state.secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.secondsRemaining <= 1) {
            // Timer complete
            return {
              ...prev,
              isRunning: false,
              isPaused: false,
              secondsRemaining: 0,
            };
          }
          return {
            ...prev,
            secondsRemaining: prev.secondsRemaining - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning, state.isPaused]);

  // Handle timer completion
  useEffect(() => {
    if (state.isRunning === false && state.secondsRemaining === 0 && state.totalSeconds > 0) {
      // Timer just completed
      hapticSuccess();
      
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      const typeLabel = state.sessionType === 'focus' ? 'Focus' : state.sessionType === 'break' ? 'Break' : 'Rest';
      toast({
        title: `${typeLabel} complete!`,
        description: state.currentTaskTitle ? `Great work on "${state.currentTaskTitle}"` : 'Time for a break?',
      });

      // Reset total seconds to prevent re-triggering
      setState(prev => ({ ...prev, totalSeconds: 0 }));
    }
  }, [state.isRunning, state.secondsRemaining, state.totalSeconds, state.sessionType, state.currentTaskTitle, toast]);

  const startTimer = useCallback((
    minutes: number,
    taskId?: string,
    taskTitle?: string,
    type: 'focus' | 'break' | 'rest' = 'focus'
  ) => {
    hapticMedium();
    const seconds = minutes * 60;
    setState({
      isRunning: true,
      isPaused: false,
      secondsRemaining: seconds,
      totalSeconds: seconds,
      currentTaskId: taskId || null,
      currentTaskTitle: taskTitle || null,
      sessionType: type,
    });
  }, []);

  const pauseTimer = useCallback(() => {
    hapticMedium();
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeTimer = useCallback(() => {
    hapticMedium();
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const resetTimer = useCallback(() => {
    hapticMedium();
    setState({
      isRunning: false,
      isPaused: false,
      secondsRemaining: 0,
      totalSeconds: 0,
      currentTaskId: null,
      currentTaskTitle: null,
      sessionType: 'focus',
    });
  }, []);

  const addMinutes = useCallback((minutes: number) => {
    setState(prev => ({
      ...prev,
      secondsRemaining: prev.secondsRemaining + minutes * 60,
      totalSeconds: prev.totalSeconds + minutes * 60,
    }));
  }, []);

  return (
    <FocusTimerContext.Provider
      value={{
        ...state,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        addMinutes,
      }}
    >
      {children}
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const context = useContext(FocusTimerContext);
  if (!context) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider');
  }
  return context;
}
