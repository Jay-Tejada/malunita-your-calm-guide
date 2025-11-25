/**
 * Tone Adjuster
 * Determines the communication tone based on emotional state and cognitive load
 */

import { EmotionalMemory } from '@/state/emotionalMemory';
import { CognitiveLoad } from '@/state/cognitiveModel';

export type ToneLabel =
  | 'soft'
  | 'encouraging'
  | 'firm'
  | 'playful'
  | 'celebratory'
  | 'calming'
  | 'urgent-but-kind';

interface ToneContext {
  emotionalState: EmotionalMemory;
  cognitiveLoad?: CognitiveLoad;
  tasksBehavior?: {
    completedToday: number;
    createdToday: number;
    streakCount: number;
  };
}

/**
 * Determine the optimal tone for AI responses
 */
export function determineTone(context: ToneContext): ToneLabel {
  const { emotionalState, cognitiveLoad, tasksBehavior } = context;

  // Priority 1: High stress + high overwhelm = calming
  if (emotionalState.stress > 75 && emotionalState.overwhelm > 70) {
    return 'calming';
  }

  // Priority 2: Very high fatigue = soft
  if (emotionalState.fatigue > 80) {
    return 'soft';
  }

  // Priority 3: High encouragement need = encouraging
  if (emotionalState.encouragement_need > 70) {
    return 'encouraging';
  }

  // Priority 4: High momentum + high joy = celebratory
  if (emotionalState.momentum > 70 && emotionalState.joy > 65) {
    return 'celebratory';
  }

  // Priority 5: Streak detected = playful
  if (tasksBehavior?.streakCount && tasksBehavior.streakCount >= 3) {
    return 'playful';
  }

  // Priority 6: High cognitive load with stress = urgent-but-kind
  if (cognitiveLoad && cognitiveLoad.stress_signals > 70 && cognitiveLoad.overall > 65) {
    return 'urgent-but-kind';
  }

  // Priority 7: High resilience = firm
  if (emotionalState.resilience > 70 && emotionalState.momentum > 60) {
    return 'firm';
  }

  // Priority 8: Moderate stress = encouraging
  if (emotionalState.stress > 50 && emotionalState.stress <= 75) {
    return 'encouraging';
  }

  // Default: soft (balanced and gentle)
  return 'soft';
}

/**
 * Get tone description for system prompts
 */
export function getToneDescription(tone: ToneLabel): string {
  const descriptions: Record<ToneLabel, string> = {
    soft: 'Use gentle, reassuring language. Be warm and patient. Example: "Take your time. I am here with you."',
    encouraging: 'Be supportive and motivating. Celebrate small wins. Example: "You are doing great! Let us keep this momentum going."',
    firm: 'Be direct and clear. Focus on action. Example: "Here is what needs attention right now. Let us tackle it."',
    playful: 'Add light energy and fun. Use positive language. Example: "Nice! You are on a roll!"',
    celebratory: 'Express genuine excitement. Amplify the joy. Example: "YES!! This is amazing! Look at you go!"',
    calming: 'Bring calm and stability. Reduce pressure. Example: "Let us slow down. One thing at a time. You have got this."',
    'urgent-but-kind': 'Show urgency with compassion. Be clear but caring. Example: "I know it feels like a lot. Let us focus on what matters most right now."',
  };

  return descriptions[tone];
}

/**
 * Apply tone to a message (for edge functions)
 */
export function applyToneToMessage(message: string, tone: ToneLabel): string {
  const prefixes: Record<ToneLabel, string> = {
    soft: '💙 ',
    encouraging: '✨ ',
    firm: '🎯 ',
    playful: '🎉 ',
    celebratory: '🌟 ',
    calming: '🌸 ',
    'urgent-but-kind': '⏱️ ',
  };

  return prefixes[tone] + message;
}
