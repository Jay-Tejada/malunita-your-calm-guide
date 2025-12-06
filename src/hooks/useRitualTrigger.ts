import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type RitualType = "morning" | "evening" | null;

export function useRitualTrigger() {
  const [shouldShowRitual, setShouldShowRitual] = useState<RitualType>(null);

  useEffect(() => {
    const checkRitualTrigger = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's ritual preferences
        const { data: profile } = await supabase
          .from('profiles')
          .select('ritual_preferences')
          .eq('id', user.id)
          .single();

        const ritualPrefs = profile?.ritual_preferences as any;
        
        // Check if auto-start is disabled
        if (ritualPrefs?.morning_ritual?.enabled === false && ritualPrefs?.evening_ritual?.enabled === false) {
          return;
        }

        const now = new Date();
        const hour = now.getHours();
        const today = now.toISOString().split('T')[0];

        // Morning ritual disabled - using DailyPriorityPrompt instead

        // Evening ritual disabled - no longer auto-triggers
      } catch (error) {
        console.error('Error checking ritual trigger:', error);
      }
    };

    checkRitualTrigger();
  }, []);

  const dismissRitual = async () => {
    // Save that we've shown the ritual today (whether completed or skipped)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && shouldShowRitual) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('ritual_preferences')
          .eq('id', user.id)
          .single();

        const ritualPrefs = (profile?.ritual_preferences as any) || {};
        const now = new Date().toISOString();

        await supabase
          .from('profiles')
          .update({
            ritual_preferences: {
              ...ritualPrefs,
              ...(shouldShowRitual === 'evening' ? { last_evening_ritual: now } : {}),
              ...(shouldShowRitual === 'morning' ? { last_morning_ritual: now } : {})
            }
          })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error saving ritual dismissal:', error);
    }
    
    setShouldShowRitual(null);
  };

  return {
    shouldShowRitual,
    dismissRitual
  };
}