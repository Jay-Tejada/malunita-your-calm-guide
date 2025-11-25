import malunitaNeutral from '@/assets/companions/malunita-neutral.png';
import malunitaHappy from '@/assets/companions/malunita-happy.png';
import malunitaCalm from '@/assets/companions/malunita-calm.png';
import malunitaCurious from '@/assets/companions/malunita-curious.png';
import malunitaExcited from '@/assets/companions/malunita-excited.png';

// Expression imports
import baseExpression from '@/assets/companions/base_expression.png';
import happyExpression from '@/assets/companions/base_happy_expression.png';
import concernedExpression from '@/assets/companions/concerned_expression.png';
import excitedExpression from '@/assets/companions/excited_expression.png';
import happy2Expression from '@/assets/companions/happy_2_expression.png';
import happyToSeeYouExpression from '@/assets/companions/happy_to_see_you_expression.png';
import loveExpression from '@/assets/companions/love_expression.png';
import lowEnergyExpression from '@/assets/companions/low_energy_expression.png';
import overjoyedExpression from '@/assets/companions/overjoyed_expression.png';
import sleepingExpression from '@/assets/companions/sleeping_expression.png';
import surprised2Expression from '@/assets/companions/surprised_2_expression.png';
import surprisedExpression from '@/assets/companions/surprised_expression.png';
import whyExpression from '@/assets/companions/why_expression.png';
import winkingExpression from '@/assets/companions/winking_expression.png';
import angryExpression from '@/assets/companions/angry_expression.png';

export type CompanionVisualState = 
  | 'happy' 
  | 'excited' 
  | 'calm' 
  | 'curious' 
  | 'neutral';

export const companionAssets: Record<CompanionVisualState, string> = {
  happy: malunitaHappy,
  excited: malunitaExcited,
  calm: malunitaCalm,
  curious: malunitaCurious,
  neutral: malunitaNeutral,
};

// Expression assets for auto-selection
export const expressionAssets = {
  base: baseExpression,
  happy: happyExpression,
  concerned: concernedExpression,
  excited: excitedExpression,
  happy2: happy2Expression,
  happyToSeeYou: happyToSeeYouExpression,
  love: loveExpression,
  lowEnergy: lowEnergyExpression,
  overjoyed: overjoyedExpression,
  sleeping: sleepingExpression,
  surprised2: surprised2Expression,
  surprised: surprisedExpression,
  why: whyExpression,
  winking: winkingExpression,
  angry: angryExpression,
};

/**
 * Auto-select expression based on emotional state
 */
export const selectExpressionFromEmotion = (params: {
  emotion: string;
  stress?: number;
  momentum?: number;
  fatigue?: number;
  joy?: number;
}): string => {
  const { emotion, stress = 50, momentum = 50, fatigue = 50, joy = 50 } = params;

  // Calming emotion → sleepy, low_energy
  if (emotion === 'calm' || emotion === 'calming') {
    if (fatigue > 70) return expressionAssets.sleeping;
    return expressionAssets.lowEnergy;
  }

  // Proud emotion → happy_to_see_you, happy2
  if (emotion === 'proud') {
    if (momentum > 70) return expressionAssets.happyToSeeYou;
    return expressionAssets.happy2;
  }

  // Concerned emotion → concerned, why
  if (emotion === 'concerned') {
    if (stress > 75) return expressionAssets.why;
    return expressionAssets.concerned;
  }

  // Energetic emotion → excited, overjoyed
  if (emotion === 'excited' || emotion === 'energetic') {
    if (joy > 80 || momentum > 80) return expressionAssets.overjoyed;
    return expressionAssets.excited;
  }

  // Loving emotion → love, happy_to_see_you
  if (emotion === 'loving') {
    return expressionAssets.love;
  }

  // Overwhelmed emotion → why, concerned
  if (emotion === 'overwhelmed') {
    return expressionAssets.why;
  }

  // Sleepy → sleeping, low_energy
  if (emotion === 'sleepy') {
    if (fatigue > 80) return expressionAssets.sleeping;
    return expressionAssets.lowEnergy;
  }

  // Encouraging/supportive → happy, happy2
  if (emotion === 'encouraging' || emotion === 'supportive') {
    return expressionAssets.happy;
  }

  // Focused → base
  if (emotion === 'focused') {
    return expressionAssets.base;
  }

  // Default happy states
  if (emotion === 'happy' && joy > 70) {
    return expressionAssets.happy2;
  }

  return expressionAssets.happy;
};

// Map emotion states to visual assets
export const emotionToVisualState = (emotion: string): CompanionVisualState => {
  switch (emotion) {
    case 'excited':
    case 'motivated':
    case 'accomplished':
    case 'energetic':
      return 'excited';
    case 'happy':
    case 'content':
    case 'playful':
    case 'encouraging':
    case 'supportive':
      return 'happy';
    case 'calm':
    case 'peaceful':
    case 'sleepy':
    case 'calming':
      return 'calm';
    case 'curious':
    case 'focused':
    case 'neutral':
    default:
      return 'curious';
  }
};

// Map motion states to visual assets
export const motionToVisualState = (motion: string): CompanionVisualState => {
  switch (motion) {
    case 'excited':
    case 'fiesta':
      return 'excited';
    case 'curious':
      return 'curious';
    case 'sleepy':
      return 'calm';
    case 'idle':
    default:
      return 'happy';
  }
};
