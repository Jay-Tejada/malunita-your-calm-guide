import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CompanionStage = 0 | 1 | 2 | 3 | 4;

export interface StageConfig {
  name: string;
  minXp: number;
  maxXp: number;
  orbSize: number; // multiplier for base size
  glowIntensity: number; // 0-1
  motionComplexity: number; // 0-1
  haloRadius: number; // multiplier
  particleCount: number;
}

const STAGE_CONFIGS: Record<CompanionStage, StageConfig> = {
  0: {
    name: 'Seed',
    minXp: 0,
    maxXp: 50,
    orbSize: 0.7,
    glowIntensity: 0.3,
    motionComplexity: 0.2,
    haloRadius: 0.5,
    particleCount: 0,
  },
  1: {
    name: 'Sprout',
    minXp: 50,
    maxXp: 100,
    orbSize: 0.85,
    glowIntensity: 0.5,
    motionComplexity: 0.4,
    haloRadius: 0.8,
    particleCount: 2,
  },
  2: {
    name: 'Companion',
    minXp: 100,
    maxXp: 200,
    orbSize: 1.0,
    glowIntensity: 0.7,
    motionComplexity: 0.6,
    haloRadius: 1.0,
    particleCount: 4,
  },
  3: {
    name: 'Lumina',
    minXp: 200,
    maxXp: 400,
    orbSize: 1.15,
    glowIntensity: 0.85,
    motionComplexity: 0.8,
    haloRadius: 1.3,
    particleCount: 6,
  },
  4: {
    name: 'Cosmic',
    minXp: 400,
    maxXp: Infinity,
    orbSize: 1.3,
    glowIntensity: 1.0,
    motionComplexity: 1.0,
    haloRadius: 1.6,
    particleCount: 10,
  },
};

export interface CompanionGrowthHook {
  xp: number;
  stage: CompanionStage;
  stageConfig: StageConfig;
  progressToNextStage: number; // 0-1
  isEvolving: boolean;
  addXp: (amount: number, source: string) => Promise<void>;
  refetch: () => Promise<void>;
  checkUnlocks?: () => Promise<void>; // Will be set by VoiceOrb after cosmetics hook is available
}

export const useCompanionGrowth = (): CompanionGrowthHook => {
  const [xp, setXp] = useState(0);
  const [stage, setStage] = useState<CompanionStage>(2); // Default to Companion
  const [isEvolving, setIsEvolving] = useState(false);
  const [checkUnlocks, setCheckUnlocks] = useState<(() => Promise<void>) | undefined>(undefined);
  const { toast } = useToast();

  const stageConfig = STAGE_CONFIGS[stage];

  // Calculate progress to next stage (0-1)
  const progressToNextStage =
    stage === 4
      ? 1
      : (xp - stageConfig.minXp) / (stageConfig.maxXp - stageConfig.minXp);

  // Determine stage from XP
  const getStageFromXp = useCallback((currentXp: number): CompanionStage => {
    if (currentXp < 50) return 0;
    if (currentXp < 100) return 1;
    if (currentXp < 200) return 2;
    if (currentXp < 400) return 3;
    return 4;
  }, []);

  // Fetch companion data from profile
  const fetchCompanionData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('companion_xp, companion_stage')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching companion data:', error);
      return;
    }

    if (data) {
      const currentXp = data.companion_xp || 0;
      const currentStage = (data.companion_stage || 2) as CompanionStage;

      setXp(currentXp);
      setStage(currentStage);
    }
  }, []);

  // Add XP and check for level up
  const addXp = useCallback(
    async (amount: number, source: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newXp = xp + amount;
      const newStage = getStageFromXp(newXp);
      const didLevelUp = newStage > stage;

      // Update database
      const { error } = await supabase
        .from('profiles')
        .update({
          companion_xp: newXp,
          companion_stage: newStage,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating companion XP:', error);
        toast({
          title: 'Error',
          description: 'Failed to update companion progress',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setXp(newXp);

      // Handle evolution
      if (didLevelUp) {
        setIsEvolving(true);
        setStage(newStage);

        toast({
          title: '✨ Evolution!',
          description: `Your companion evolved to ${STAGE_CONFIGS[newStage].name}!`,
          duration: 5000,
        });

        // Reset evolution state after animation
        setTimeout(() => {
          setIsEvolving(false);
        }, 3000);
      } else {
        // Just show XP gain for non-evolution
        if (amount >= 3) {
          toast({
            title: `+${amount} XP`,
            description: source,
            duration: 2000,
          });
        }
      }
      
      // Check for cosmetic unlocks
      if (checkUnlocks) {
        await checkUnlocks();
      }
    },
    [xp, stage, getStageFromXp, toast, checkUnlocks]
  );

  // Initial fetch
  useEffect(() => {
    fetchCompanionData();
  }, [fetchCompanionData]);

  return {
    xp,
    stage,
    stageConfig,
    progressToNextStage,
    isEvolving,
    addXp,
    refetch: fetchCompanionData,
    checkUnlocks,
  };
};
