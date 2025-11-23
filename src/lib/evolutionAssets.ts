import { getExpressionAsset } from '@/utils/getExpressionAsset';

// Import Stage 1 (baby form) - existing assets
import baseExpression from '@/assets/companions/base_expression.png';
import baseHappyExpression from '@/assets/companions/base_happy_expression.png';
import excitedExpression from '@/assets/companions/excited_expression.png';
import overjoyedExpression from '@/assets/companions/overjoyed_expression.png';
import happy2Expression from '@/assets/companions/happy_2_expression.png';
import happyToSeeYouExpression from '@/assets/companions/happy_to_see_you_expression.png';
import loveExpression from '@/assets/companions/love_expression.png';
import winkingExpression from '@/assets/companions/winking_expression.png';
import surprisedExpression from '@/assets/companions/surprised_expression.png';
import surprised2Expression from '@/assets/companions/surprised_2_expression.png';
import concernedExpression from '@/assets/companions/concerned_expression.png';
import whyExpression from '@/assets/companions/why_expression.png';
import lowEnergyExpression from '@/assets/companions/low_energy_expression.png';
import sleepingExpression from '@/assets/companions/sleeping_expression.png';
import angryExpression from '@/assets/companions/angry_expression.png';

// Import Stage 2 (juvenile) - Malunita assets
import malunitaNeutral from '@/assets/companions/malunita-neutral.png';
import malunitaHappy from '@/assets/companions/malunita-happy.png';
import malunitaExcited from '@/assets/companions/malunita-excited.png';
import malunitaCurious from '@/assets/companions/malunita-curious.png';
import malunitaCalm from '@/assets/companions/malunita-calm.png';

// Import Stage 3 (teen) - Baby assets (can be used as teen form)
import babyNeutral from '@/assets/companions/baby-neutral.png';
import babyHappy from '@/assets/companions/baby-happy.png';
import babyListening from '@/assets/companions/baby-listening.png';
import babySleepy from '@/assets/companions/baby-sleepy.png';

export type EvolutionStage = 1 | 2 | 3 | 4;

// Stage 1 (baby form): Level 1-4
const stage1Assets: Record<string, string> = {
  'base_expression.png': baseExpression,
  'base_happy_expression.png': baseHappyExpression,
  'excited_expression.png': excitedExpression,
  'overjoyed_expression.png': overjoyedExpression,
  'happy_2_expression.png': happy2Expression,
  'happy_to_see_you_expression.png': happyToSeeYouExpression,
  'love_expression.png': loveExpression,
  'winking_expression.png': winkingExpression,
  'surprised_expression.png': surprisedExpression,
  'surprised_2_expression.png': surprised2Expression,
  'concerned_expression.png': concernedExpression,
  'why_expression.png': whyExpression,
  'low_energy_expression.png': lowEnergyExpression,
  'sleeping_expression.png': sleepingExpression,
  'angry_expression.png': angryExpression,
};

// Stage 2 (juvenile form): Level 5-9
const stage2Assets: Record<string, string> = {
  'base_expression.png': malunitaNeutral,
  'base_happy_expression.png': malunitaHappy,
  'excited_expression.png': malunitaExcited,
  'overjoyed_expression.png': malunitaExcited,
  'happy_2_expression.png': malunitaHappy,
  'happy_to_see_you_expression.png': malunitaHappy,
  'love_expression.png': malunitaHappy,
  'winking_expression.png': malunitaHappy,
  'surprised_expression.png': malunitaCurious,
  'surprised_2_expression.png': malunitaCurious,
  'concerned_expression.png': malunitaCurious,
  'why_expression.png': malunitaCurious,
  'low_energy_expression.png': malunitaCalm,
  'sleeping_expression.png': malunitaCalm,
  'angry_expression.png': malunitaNeutral,
};

// Stage 3 (teen form): Level 10-14
const stage3Assets: Record<string, string> = {
  'base_expression.png': babyNeutral,
  'base_happy_expression.png': babyHappy,
  'excited_expression.png': babyHappy,
  'overjoyed_expression.png': babyHappy,
  'happy_2_expression.png': babyHappy,
  'happy_to_see_you_expression.png': babyHappy,
  'love_expression.png': babyHappy,
  'winking_expression.png': babyHappy,
  'surprised_expression.png': babyListening,
  'surprised_2_expression.png': babyListening,
  'concerned_expression.png': babyListening,
  'why_expression.png': babyListening,
  'low_energy_expression.png': babySleepy,
  'sleeping_expression.png': babySleepy,
  'angry_expression.png': babyNeutral,
};

// Stage 4 (final form): Level 15-20 - uses stage 3 for now with enhancements
const stage4Assets: Record<string, string> = {
  ...stage3Assets, // Same as stage 3 but will have special effects in CreatureSprite
};

const stageAssetMap: Record<EvolutionStage, Record<string, string>> = {
  1: stage1Assets,
  2: stage2Assets,
  3: stage3Assets,
  4: stage4Assets,
};

/**
 * Get the creature asset based on evolution stage and emotion
 * Falls back to stage 1 if the specific stage asset is missing
 */
export const getCreatureAsset = (stage: EvolutionStage, emotion: string): string => {
  const filename = getExpressionAsset(emotion);
  const stageAssets = stageAssetMap[stage];
  
  // Try to get asset for current stage
  if (stageAssets[filename]) {
    return stageAssets[filename];
  }
  
  // Fallback to stage 1 if not found
  return stage1Assets[filename] || baseExpression;
};

/**
 * Get stat boosts based on evolution stage
 */
export const getStageBoosts = (stage: EvolutionStage) => {
  switch (stage) {
    case 1:
      return {
        idleCycleDuration: 3000,
        microEmotionFrequency: 1.0,
        glowMultiplier: 1.0,
        particleCount: 0,
      };
    case 2:
      return {
        idleCycleDuration: 2700, // 10% faster
        microEmotionFrequency: 1.1,
        glowMultiplier: 1.1,
        particleCount: 2,
      };
    case 3:
      return {
        idleCycleDuration: 2400, // 20% faster
        microEmotionFrequency: 1.3, // More expressive
        glowMultiplier: 1.2,
        particleCount: 4,
      };
    case 4:
      return {
        idleCycleDuration: 2100, // 30% faster
        microEmotionFrequency: 1.5, // Most expressive
        glowMultiplier: 1.5, // Special glow
        particleCount: 6,
      };
  }
};

/**
 * Determine evolution stage from level
 */
export const getEvolutionStage = (level: number): EvolutionStage => {
  if (level >= 15) return 4;
  if (level >= 10) return 3;
  if (level >= 5) return 2;
  return 1;
};
