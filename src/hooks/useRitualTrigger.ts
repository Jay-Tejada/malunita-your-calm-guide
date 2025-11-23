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

        // Check morning ritual (5am - 11am)
        if (hour >= 5 && hour < 11) {
          const lastMorning = ritualPrefs?.last_morning_ritual;
          const lastMorningDate = lastMorning ? new Date(lastMorning).toISOString().split('T')[0] : null;
          
          if (lastMorningDate !== today && ritualPrefs?.morning_ritual?.enabled !== false) {
            setShouldShowRitual("morning");
            return;
          }
        }

        // Check evening ritual (7pm - 1am)
        if (hour >= 19 || hour < 1) {
          const lastEvening = ritualPrefs?.last_evening_ritual;
          const lastEveningDate = lastEvening ? new Date(lastEvening).toISOString().split('T')[0] : null;
          
          // For times after midnight, check against yesterday
          const checkDate = hour < 1 ? 
            new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
            today;
          
          if (lastEveningDate !== checkDate && ritualPrefs?.evening_ritual?.enabled !== false) {
            setShouldShowRitual("evening");
            return;
          }
        }
      } catch (error) {
        console.error('Error checking ritual trigger:', error);
      }
    };

    checkRitualTrigger();
  }, []);

  return {
    shouldShowRitual,
    dismissRitual: () => setShouldShowRitual(null)
  };
}