import { useEffect } from 'react';
import { useOrbStore } from '@/state/orbState';
import { supabase } from '@/integrations/supabase/client';

export function useOrbSync(userId: string | undefined) {
  const { stage, setTimeOfDay } = useOrbStore();

  // Sync time of day
  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay(hour);
    
    const interval = setInterval(() => {
      setTimeOfDay(new Date().getHours());
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [setTimeOfDay]);

  // Sync stage to database
  useEffect(() => {
    if (!userId) return;
    
    const syncStage = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ companion_stage: stage })
          .eq('id', userId);
      } catch (error) {
        console.error('Failed to sync orb stage:', error);
      }
    };
    
    syncStage();
  }, [stage, userId]);

  return null;
}
