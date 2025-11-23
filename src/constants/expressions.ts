export const CREATURE_EXPRESSIONS = {
  neutral: "base_expression.png",
  happy: "base_happy_expression.png",
  excited: "excited_expression.png",
  overjoyed: "overjoyed_expression.png",
  laughing: "happy_2_expression.png",
  welcoming: "happy_to_see_you_expression.png",
  loving: "love_expression.png",
  winking: "winking_expression.png",

  surprised: "surprised_expression.png",
  surprised2: "surprised_2_expression.png",

  concerned: "concerned_expression.png",
  worried: "why_expression.png",

  sad: "low_energy_expression.png",
  sleepy: "low_energy_expression.png",
  sleeping: "sleeping_expression.png",

  angry: "angry_expression.png",
} as const;

export type CreatureExpression = keyof typeof CREATURE_EXPRESSIONS;
