import { useEmotionalMemory } from '@/state/emotionalMemory';
import { useMoodStore } from '@/state/moodMachine';

export interface GreetingContext {
  streakCount?: number;
  lastActivityHours?: number;
}

export function generateGreeting(context?: GreetingContext): string {
  const hour = new Date().getHours();
  const emotionalMemory = useEmotionalMemory.getState();
  const mood = useMoodStore.getState().mood;
  const { streakCount = 0, lastActivityHours = 0 } = context || {};

  // High affection override
  if (emotionalMemory.affection >= 75) {
    return "I missed you 💛 What's happening today?";
  }

  // Long inactivity (>24 hours)
  if (lastActivityHours > 24) {
    return "Welcome back! I saved your tasks for you.";
  }

  // Streak recognition
  if (streakCount > 3) {
    return "👏 You're on a roll again!";
  }

  // Mood-based greeting (tired/sleepy)
  if (mood === 'sleepy' || mood === 'sleeping') {
    return "I'm kinda sleepy… but I'm here.";
  }

  // Time-based greetings
  if (hour >= 5 && hour < 12) {
    return "Good morning! Let's start slow.";
  } else if (hour >= 12 && hour < 18) {
    return "Hey hey! Ready to keep going?";
  } else {
    return "Evening friend 🌙 Want to wind down?";
  }
}

export function greetUser(context?: GreetingContext): string {
  return generateGreeting(context);
}
