import { CREATURE_EXPRESSIONS } from '@/constants/expressions';

export const getExpressionAsset = (emotion: string): string => {
  const map = CREATURE_EXPRESSIONS;

  // 1. Sanitize incoming emotion
  if (!emotion || typeof emotion !== "string") return map.neutral;

  const key = emotion.toLowerCase().trim();

  // 2. Direct match
  if (key in map) return map[key as keyof typeof map];

  // 3. Fallback aliases
  const aliases: Record<string, keyof typeof CREATURE_EXPRESSIONS> = {
    // positive
    joy: "happy",
    joyful: "happy",
    delighted: "happy",
    excited: "excited",
    thrilled: "excited",
    proud: "happy",
    love: "loving",
    affectionate: "loving",
    kiss: "loving",
    // gestures
    wave: "welcoming",
    hello: "welcoming",
    hi: "welcoming",
    // neutral
    blank: "neutral",
    none: "neutral",
    idle: "neutral",
    // confusion
    confused: "worried",
    unsure: "worried",
    thinking: "worried",
    // fear/surprise
    shocked: "surprised",
    wow: "surprised2",
    scared: "concerned",
    nervous: "concerned",
    // sadness
    tired: "sleepy",
    low: "sad",
    down: "sad",
    // anger
    mad: "angry",
    upset: "angry",
  };

  if (aliases[key] && map[aliases[key]]) return map[aliases[key]];

  // default
  return map.neutral;
};
