import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompanionStage } from './useCompanionGrowth';

export type LoreTrigger = 
  | 'evolution' 
  | 'weekly' 
  | 'return' 
  | 'growth' 
  | 'focus';

interface LoreMoment {
  text: string;
  trigger: LoreTrigger;
}

const LORE_LIBRARY: Record<LoreTrigger, string[]> = {
  evolution: [
    "Cosmic dust gathers around them — evolution is near.",
    "A faint ripple in the habitat… something is growing.",
    "They shimmer with newfound energy — change approaches.",
    "The universe whispers: transformation awaits.",
  ],
  weekly: [
    "Your companion hums softly today — they're sensing your focus.",
    "They drift closer when you're present.",
    "A gentle pulse — they recognize your rhythm.",
    "Energy flows between you both, quiet and steady.",
  ],
  return: [
    "They glow a little brighter when you return.",
    "A soft ripple — they noticed your absence.",
    "Welcome back. They've been waiting, patient and still.",
    "Your presence draws them from the depths of their habitat.",
  ],
  growth: [
    "Each completed task strengthens their light.",
    "They resonate with your consistency.",
    "Your actions echo through the Malunita Universe.",
    "Steady effort fuels their evolution.",
  ],
  focus: [
    "They sense your deep work — the habitat stills.",
    "Focus draws them closer, orbit tightening.",
    "In your concentration, they find harmony.",
    "Together, you create a field of clarity.",
  ],
};

const LORE_DISPLAY_DURATION = 8000; // 8 seconds
const MIN_TIME_BETWEEN_LORE = 3 * 24 * 60 * 60 * 1000; // 3 days

export interface LoreMomentsHook {
  currentLore: LoreMoment | null;
  triggerLore: (trigger: LoreTrigger) => Promise<void>;
  dismissLore: () => void;
}

export const useLoreMoments = (
  companionStage: CompanionStage,
  isEvolvingNow: boolean
): LoreMomentsHook => {
  const [currentLore, setCurrentLore] = useState<LoreMoment | null>(null);
  const [lastShownAt, setLastShownAt] = useState<Date | null>(null);

  // Fetch last shown timestamp from profile
  useEffect(() => {
    const fetchLastShown = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('last_lore_shown_at')
        .eq('id', user.id)
        .single();

      if (data?.last_lore_shown_at) {
        setLastShownAt(new Date(data.last_lore_shown_at));
      }
    };

    fetchLastShown();
  }, []);

  // Auto-trigger evolution lore
  useEffect(() => {
    if (isEvolvingNow && companionStage > 0) {
      triggerLore('evolution');
    }
  }, [isEvolvingNow, companionStage]);

  const shouldShowLore = useCallback((): boolean => {
    if (!lastShownAt) return true;
    
    const timeSinceLastShown = Date.now() - lastShownAt.getTime();
    return timeSinceLastShown >= MIN_TIME_BETWEEN_LORE;
  }, [lastShownAt]);

  const triggerLore = useCallback(async (trigger: LoreTrigger) => {
    // Skip if lore shown too recently (except for evolution)
    if (trigger !== 'evolution' && !shouldShowLore()) {
      return;
    }

    // Get random lore from trigger category
    const loreOptions = LORE_LIBRARY[trigger];
    const randomLore = loreOptions[Math.floor(Math.random() * loreOptions.length)];

    setCurrentLore({
      text: randomLore,
      trigger,
    });

    // Update database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('lore_moments_seen')
        .eq('id', user.id)
        .single();

      await supabase
        .from('profiles')
        .update({
          last_lore_shown_at: new Date().toISOString(),
          lore_moments_seen: (profile?.lore_moments_seen || 0) + 1,
        })
        .eq('id', user.id);

      setLastShownAt(new Date());
    }

    // Auto-dismiss after duration
    setTimeout(() => {
      setCurrentLore(null);
    }, LORE_DISPLAY_DURATION);
  }, [shouldShowLore]);

  const dismissLore = useCallback(() => {
    setCurrentLore(null);
  }, []);

  return {
    currentLore,
    triggerLore,
    dismissLore,
  };
};
