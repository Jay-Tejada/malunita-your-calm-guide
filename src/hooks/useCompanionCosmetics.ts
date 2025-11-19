import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Colorway = 
  | 'zen-default' 
  | 'dawn-peach' 
  | 'galaxy-indigo' 
  | 'solar-gold' 
  | 'mist-blue' 
  | 'onyx-shadow';

export type Aura = 
  | 'calm-bloom' 
  | 'pulse-ring' 
  | 'dreamwave' 
  | 'starlight-halo';

export type Trail = 
  | 'subtle-drift' 
  | 'star-flecks' 
  | 'ascending-dust';

interface UnlockCondition {
  name: string;
  description: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  companionXp: number;
  companionStage: number;
  taskStreak: number;
  reflectionStreak: number;
  voiceSessions: number;
  fiestaCount: number;
}

// Unlock conditions for each cosmetic
const COLORWAY_UNLOCKS: Record<Colorway, UnlockCondition> = {
  'zen-default': {
    name: 'Zen Default',
    description: 'Starting colorway',
    check: () => true,
  },
  'dawn-peach': {
    name: 'Dawn Peach',
    description: 'Reach Stage 2 (Companion)',
    check: (stats) => stats.companionStage >= 2,
  },
  'galaxy-indigo': {
    name: 'Galaxy Indigo',
    description: 'Reach Stage 3 (Lumina)',
    check: (stats) => stats.companionStage >= 3,
  },
  'solar-gold': {
    name: 'Solar Gold',
    description: 'Complete 10 Tiny Task Fiestas',
    check: (stats) => stats.fiestaCount >= 10,
  },
  'mist-blue': {
    name: 'Mist Blue',
    description: 'Maintain a 7-day task streak',
    check: (stats) => stats.taskStreak >= 7,
  },
  'onyx-shadow': {
    name: 'Onyx Shadow',
    description: 'Reach Stage 4 (Cosmic) & 30-day reflection streak',
    check: (stats) => stats.companionStage >= 4 && stats.reflectionStreak >= 30,
  },
};

const AURA_UNLOCKS: Record<Aura, UnlockCondition> = {
  'calm-bloom': {
    name: 'Calm Bloom',
    description: 'Default aura',
    check: () => true,
  },
  'pulse-ring': {
    name: 'Pulse Ring',
    description: 'Complete 50 tasks',
    check: (stats) => stats.companionXp >= 50,
  },
  'dreamwave': {
    name: 'Dreamwave',
    description: '30 voice sessions',
    check: (stats) => stats.voiceSessions >= 30,
  },
  'starlight-halo': {
    name: 'Starlight Halo',
    description: 'Reach Stage 3 & 14-day task streak',
    check: (stats) => stats.companionStage >= 3 && stats.taskStreak >= 14,
  },
};

const TRAIL_UNLOCKS: Record<Trail, UnlockCondition> = {
  'subtle-drift': {
    name: 'Subtle Drift',
    description: 'Reach Stage 4 (Cosmic)',
    check: (stats) => stats.companionStage >= 4,
  },
  'star-flecks': {
    name: 'Star Flecks',
    description: 'Stage 4 & 20 Fiestas',
    check: (stats) => stats.companionStage >= 4 && stats.fiestaCount >= 20,
  },
  'ascending-dust': {
    name: 'Ascending Dust',
    description: 'Stage 4 & 100 voice sessions',
    check: (stats) => stats.companionStage >= 4 && stats.voiceSessions >= 100,
  },
};

export interface CompanionCosmeticsHook {
  unlockedColorways: Colorway[];
  unlockedAuras: Aura[];
  unlockedTrails: Trail[];
  selectedColorway: Colorway;
  selectedAura: Aura;
  selectedTrail: Trail | null;
  selectColorway: (colorway: Colorway) => Promise<void>;
  selectAura: (aura: Aura) => Promise<void>;
  selectTrail: (trail: Trail | null) => Promise<void>;
  checkUnlocks: () => Promise<void>;
  getColorwayInfo: (colorway: Colorway) => UnlockCondition;
  getAuraInfo: (aura: Aura) => UnlockCondition;
  getTrailInfo: (trail: Trail) => UnlockCondition;
  isLoading: boolean;
}

export const useCompanionCosmetics = (): CompanionCosmeticsHook => {
  const [unlockedColorways, setUnlockedColorways] = useState<Colorway[]>(['zen-default']);
  const [unlockedAuras, setUnlockedAuras] = useState<Aura[]>(['calm-bloom']);
  const [unlockedTrails, setUnlockedTrails] = useState<Trail[]>([]);
  const [selectedColorway, setSelectedColorway] = useState<Colorway>('zen-default');
  const [selectedAura, setSelectedAura] = useState<Aura>('calm-bloom');
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch cosmetics from profile
  const fetchCosmetics = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        unlocked_colorways,
        unlocked_auras,
        unlocked_trails,
        selected_colorway,
        selected_aura,
        selected_trail
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching cosmetics:', error);
      return;
    }

    if (data) {
      setUnlockedColorways((data.unlocked_colorways || ['zen-default']) as Colorway[]);
      setUnlockedAuras((data.unlocked_auras || ['calm-bloom']) as Aura[]);
      setUnlockedTrails((data.unlocked_trails || []) as Trail[]);
      setSelectedColorway((data.selected_colorway || 'zen-default') as Colorway);
      setSelectedAura((data.selected_aura || 'calm-bloom') as Aura);
      setSelectedTrail(data.selected_trail as Trail | null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCosmetics();
  }, [fetchCosmetics]);

  // Check for new unlocks
  const checkUnlocks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select(`
        companion_xp,
        companion_stage,
        task_completion_streak,
        reflection_streak,
        voice_session_count,
        fiesta_completion_count,
        unlocked_colorways,
        unlocked_auras,
        unlocked_trails
      `)
      .eq('id', user.id)
      .single();

    if (!data) return;

    const stats: UserStats = {
      companionXp: data.companion_xp || 0,
      companionStage: data.companion_stage || 0,
      taskStreak: data.task_completion_streak || 0,
      reflectionStreak: data.reflection_streak || 0,
      voiceSessions: data.voice_session_count || 0,
      fiestaCount: data.fiesta_completion_count || 0,
    };

    const currentColorways = (data.unlocked_colorways || ['zen-default']) as Colorway[];
    const currentAuras = (data.unlocked_auras || ['calm-bloom']) as Aura[];
    const currentTrails = (data.unlocked_trails || []) as Trail[];

    let newColorways = [...currentColorways];
    let newAuras = [...currentAuras];
    let newTrails = [...currentTrails];
    let hasNewUnlocks = false;

    // Check colorways
    for (const [colorway, condition] of Object.entries(COLORWAY_UNLOCKS)) {
      if (!currentColorways.includes(colorway as Colorway) && condition.check(stats)) {
        newColorways.push(colorway as Colorway);
        hasNewUnlocks = true;
        toast({
          title: '✨ New Colorway Unlocked',
          description: condition.name,
          duration: 4000,
        });
      }
    }

    // Check auras
    for (const [aura, condition] of Object.entries(AURA_UNLOCKS)) {
      if (!currentAuras.includes(aura as Aura) && condition.check(stats)) {
        newAuras.push(aura as Aura);
        hasNewUnlocks = true;
        toast({
          title: '✨ New Aura Unlocked',
          description: condition.name,
          duration: 4000,
        });
      }
    }

    // Check trails (Stage 4 only)
    if (stats.companionStage >= 4) {
      for (const [trail, condition] of Object.entries(TRAIL_UNLOCKS)) {
        if (!currentTrails.includes(trail as Trail) && condition.check(stats)) {
          newTrails.push(trail as Trail);
          hasNewUnlocks = true;
          toast({
            title: '✨ New Trail Unlocked',
            description: condition.name,
            duration: 4000,
          });
        }
      }
    }

    // Update database if new unlocks
    if (hasNewUnlocks) {
      await supabase
        .from('profiles')
        .update({
          unlocked_colorways: newColorways,
          unlocked_auras: newAuras,
          unlocked_trails: newTrails,
        })
        .eq('id', user.id);

      setUnlockedColorways(newColorways);
      setUnlockedAuras(newAuras);
      setUnlockedTrails(newTrails);
    }
  }, [toast]);

  const selectColorway = useCallback(async (colorway: Colorway) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ selected_colorway: colorway })
      .eq('id', user.id);

    setSelectedColorway(colorway);
  }, []);

  const selectAura = useCallback(async (aura: Aura) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ selected_aura: aura })
      .eq('id', user.id);

    setSelectedAura(aura);
  }, []);

  const selectTrail = useCallback(async (trail: Trail | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ selected_trail: trail })
      .eq('id', user.id);

    setSelectedTrail(trail);
  }, []);

  return {
    unlockedColorways,
    unlockedAuras,
    unlockedTrails,
    selectedColorway,
    selectedAura,
    selectedTrail,
    selectColorway,
    selectAura,
    selectTrail,
    checkUnlocks,
    getColorwayInfo: (colorway) => COLORWAY_UNLOCKS[colorway],
    getAuraInfo: (aura) => AURA_UNLOCKS[aura],
    getTrailInfo: (trail) => TRAIL_UNLOCKS[trail],
    isLoading,
  };
};
