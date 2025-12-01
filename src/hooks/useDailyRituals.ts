import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RitualState {
  morningDone: boolean;
  eveningDone: boolean;
  shouldShowMorning: boolean;
  shouldShowEvening: boolean;
  completeMorning: () => void;
  completeEvening: () => void;
  dismissMorning: () => void;
  dismissEvening: () => void;
}

export const useDailyRituals = (): RitualState => {
  const [morningDone, setMorningDone] = useState(false);
  const [eveningDone, setEveningDone] = useState(false);
  const [dismissed, setDismissed] = useState({ morning: false, evening: false });
  
  const today = new Date().toDateString();
  const hour = new Date().getHours();
  
  // Check localStorage for today's ritual status
  useEffect(() => {
    const stored = localStorage.getItem('malunita_rituals');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        setMorningDone(data.morningDone || false);
        setEveningDone(data.eveningDone || false);
      } else {
        // New day, reset
        localStorage.setItem('malunita_rituals', JSON.stringify({
          date: today,
          morningDone: false,
          eveningDone: false
        }));
      }
    }
  }, [today]);
  
  const saveState = (morning: boolean, evening: boolean) => {
    localStorage.setItem('malunita_rituals', JSON.stringify({
      date: today,
      morningDone: morning,
      eveningDone: evening
    }));
  };
  
  const completeMorning = () => {
    setMorningDone(true);
    saveState(true, eveningDone);
  };
  
  const completeEvening = () => {
    setEveningDone(true);
    saveState(morningDone, true);
  };
  
  const dismissMorning = () => setDismissed(d => ({ ...d, morning: true }));
  const dismissEvening = () => setDismissed(d => ({ ...d, evening: true }));
  
  // Morning: show between 5am-11am if not done
  const shouldShowMorning = 
    hour >= 5 && 
    hour < 11 && 
    !morningDone && 
    !dismissed.morning;
  
  // Evening: show between 7pm-11pm if not done
  const shouldShowEvening = 
    hour >= 19 && 
    hour < 23 && 
    !eveningDone && 
    !dismissed.evening;
  
  return {
    morningDone,
    eveningDone,
    shouldShowMorning,
    shouldShowEvening,
    completeMorning,
    completeEvening,
    dismissMorning,
    dismissEvening,
  };
};
