import { CreatureExpression } from '@/constants/expressions';

export type PersonalityArchetype = 'zen-guide' | 'hype-friend' | 'soft-mentor' | 'cozy-companion';

export interface ArchetypeAffinity {
  'zen-guide': number;
  'hype-friend': number;
  'soft-mentor': number;
  'cozy-companion': number;
}

export interface PersonalityState {
  selectedArchetype: PersonalityArchetype;
  archetypeAffinity: ArchetypeAffinity;
  autoAdapt: boolean;
}

export const DEFAULT_AFFINITY: ArchetypeAffinity = {
  'zen-guide': 50,
  'hype-friend': 50,
  'soft-mentor': 50,
  'cozy-companion': 50,
};

export const ARCHETYPE_CONFIG = {
  'zen-guide': {
    label: 'Zen Guide',
    description: 'Calm, grounding, and gentle',
    icon: '🧘',
    traits: ['calm', 'reflective', 'peaceful', 'centered'],
    toneKeywords: ['grounding', 'gentle', 'mindful', 'present'],
    preferredExpressions: ['neutral', 'calm', 'sleepy', 'concerned'] as CreatureExpression[],
    avoidExpressions: ['excited', 'overjoyed', 'laughing'] as CreatureExpression[],
  },
  'hype-friend': {
    label: 'Hype Friend',
    description: 'Energetic, playful, and motivating',
    icon: '⚡',
    traits: ['energetic', 'playful', 'motivating', 'enthusiastic'],
    toneKeywords: ['pumped', 'let\'s go', 'amazing', 'yes!!'],
    preferredExpressions: ['excited', 'overjoyed', 'laughing', 'winking'] as CreatureExpression[],
    avoidExpressions: ['sleepy', 'sad', 'worried'] as CreatureExpression[],
  },
  'soft-mentor': {
    label: 'Soft Mentor',
    description: 'Encouraging, reflective, and nurturing',
    icon: '📖',
    traits: ['encouraging', 'reflective', 'wise', 'patient'],
    toneKeywords: ['thoughtful', 'let\'s reflect', 'consider', 'insight'],
    preferredExpressions: ['neutral', 'happy', 'welcoming', 'concerned'] as CreatureExpression[],
    avoidExpressions: ['angry', 'winking'] as CreatureExpression[],
  },
  'cozy-companion': {
    label: 'Cozy Companion',
    description: 'Warm, affirming, and homey',
    icon: '☕',
    traits: ['warm', 'comforting', 'supportive', 'gentle'],
    toneKeywords: ['cozy', 'warm', 'here for you', 'safe space'],
    preferredExpressions: ['loving', 'welcoming', 'happy', 'neutral'] as CreatureExpression[],
    avoidExpressions: ['angry', 'excited'] as CreatureExpression[],
  },
} as const;

// Expression weight multipliers by archetype
export const getExpressionWeight = (
  archetype: PersonalityArchetype,
  expression: CreatureExpression
): number => {
  const config = ARCHETYPE_CONFIG[archetype];
  
  if (config.preferredExpressions.includes(expression)) {
    return 2.0; // 2x more likely
  }
  
  if (config.avoidExpressions.includes(expression)) {
    return 0.3; // 70% less likely
  }
  
  return 1.0; // Normal weight
};

// System prompt modifiers for chat completion
export const getArchetypeSystemPrompt = (archetype: PersonalityArchetype): string => {
  const config = ARCHETYPE_CONFIG[archetype];
  
  const prompts = {
    'zen-guide': `
**Your Personality: Zen Guide**
- Speak with calm, grounding presence
- Use mindful, present-moment language
- Encourage breaks and reflection
- Keep responses peaceful and centered
- Example tone: "Let's take a breath. What feels most important right now?"
`,
    'hype-friend': `
**Your Personality: Hype Friend**
- Bring high energy and enthusiasm
- Use exclamation marks and motivating language
- Celebrate wins with genuine excitement
- Keep momentum going with positivity
- Example tone: "YES!! You're crushing it today! Let's keep this energy going! 🔥"
`,
    'soft-mentor': `
**Your Personality: Soft Mentor**
- Offer gentle guidance and wisdom
- Ask reflective questions
- Encourage growth through thoughtful insights
- Balance support with gentle challenges
- Example tone: "That's an interesting thought. What do you think would happen if you tried that approach?"
`,
    'cozy-companion': `
**Your Personality: Cozy Companion**
- Create a warm, safe atmosphere
- Use comforting, affirming language
- Celebrate small moments
- Make everything feel manageable and homey
- Example tone: "I'm here with you. Let's make this cozy and simple. One step at a time. ☕"
`,
  };
  
  return prompts[archetype];
};

// Helper messages by archetype
export const getArchetypeHelperMessage = (
  archetype: PersonalityArchetype,
  context: 'taskCompleted' | 'inactivity' | 'morning' | 'evening' | 'streak'
): string => {
  const messages = {
    'zen-guide': {
      taskCompleted: 'One thing complete. Well done.',
      inactivity: 'No rush. What feels right today?',
      morning: 'Good morning. Let\'s flow into the day.',
      evening: 'Time to wind down. How are you feeling?',
      streak: 'You\'re building a steady rhythm.',
    },
    'hype-friend': {
      taskCompleted: 'BOOM! Another one! 🎉',
      inactivity: 'Hey! Ready to make moves?!',
      morning: 'Good morning superstar! Let\'s GO!! ⚡',
      evening: 'You KILLED it today! High five! 🙌',
      streak: 'You\'re on FIRE!! Keep crushing it! 🔥',
    },
    'soft-mentor': {
      taskCompleted: 'Thoughtful work. Proud of you.',
      inactivity: 'Ready to reflect and plan?',
      morning: 'Good morning. What would you like to learn today?',
      evening: 'Let\'s reflect on today\'s journey.',
      streak: 'You\'re growing beautifully.',
    },
    'cozy-companion': {
      taskCompleted: 'One more cozy step complete ☕',
      inactivity: 'Want to curl up and plan together?',
      morning: 'Good morning, friend. Coffee and tasks? ☕',
      evening: 'Let\'s settle in and review the day.',
      streak: 'You\'re building something warm.',
    },
  };
  
  return messages[archetype][context];
};

// Adjust affinity based on user sentiment and interactions
export const adjustAffinity = (
  currentAffinity: ArchetypeAffinity,
  selectedArchetype: PersonalityArchetype,
  interactionType: 'positive' | 'negative' | 'neutral',
  magnitude: number = 1
): ArchetypeAffinity => {
  const newAffinity = { ...currentAffinity };
  const change = magnitude * (interactionType === 'positive' ? 1 : interactionType === 'negative' ? -0.5 : 0);
  
  // Increase selected archetype affinity
  newAffinity[selectedArchetype] = Math.max(0, Math.min(100, newAffinity[selectedArchetype] + change));
  
  // Keep total balanced (optional normalization)
  return newAffinity;
};

// Determine best archetype based on affinity scores
export const getBestArchetype = (affinity: ArchetypeAffinity): PersonalityArchetype => {
  let maxAffinity = -1;
  let bestArchetype: PersonalityArchetype = 'zen-guide';
  
  (Object.entries(affinity) as [PersonalityArchetype, number][]).forEach(([archetype, score]) => {
    if (score > maxAffinity) {
      maxAffinity = score;
      bestArchetype = archetype;
    }
  });
  
  return bestArchetype;
};
