import { create } from 'zustand';

export type Mood =
  | "neutral"
  | "happy"
  | "excited"
  | "overjoyed"
  | "welcoming"
  | "loving"
  | "winking"
  | "surprised"
  | "surprised2"
  | "concerned"
  | "worried"
  | "sad"
  | "sleepy"
  | "sleeping"
  | "angry";

export interface MoodState {
  mood: Mood;
  energy: number;   // 0-100
  lastUpdated: number;
  lastInteraction: number;
  angerCooldownTimer?: NodeJS.Timeout;
}

interface MoodStore extends MoodState {
  updateMood: (mood: Mood) => void;
  increaseEnergy: (amount: number) => void;
  decreaseEnergy: (amount: number) => void;
  autoIdle: () => void;
  recordInteraction: () => void;
  reset: () => void;
}

const IDLE_SLEEPY_THRESHOLD = 4 * 60 * 1000; // 4 minutes
const IDLE_SLEEPING_THRESHOLD = 8 * 60 * 1000; // 8 minutes
const ANGER_COOLDOWN = 6 * 1000; // 6 seconds

export const useMoodStore = create<MoodStore>((set, get) => ({
  mood: "neutral",
  energy: 70,
  lastUpdated: Date.now(),
  lastInteraction: Date.now(),

  updateMood: (mood: Mood) => {
    const state = get();
    
    // Clear existing anger cooldown if any
    if (state.angerCooldownTimer) {
      clearTimeout(state.angerCooldownTimer);
    }

    // If setting to angry, schedule cooldown to neutral
    let angerCooldownTimer: NodeJS.Timeout | undefined;
    if (mood === "angry") {
      angerCooldownTimer = setTimeout(() => {
        set({ mood: "neutral", angerCooldownTimer: undefined });
      }, ANGER_COOLDOWN);
    }

    set({
      mood,
      lastUpdated: Date.now(),
      lastInteraction: Date.now(),
      angerCooldownTimer,
    });
  },

  increaseEnergy: (amount: number) => {
    set((state) => ({
      energy: Math.min(100, state.energy + amount),
      lastUpdated: Date.now(),
    }));
  },

  decreaseEnergy: (amount: number) => {
    set((state) => ({
      energy: Math.max(0, state.energy - amount),
      lastUpdated: Date.now(),
    }));
  },

  recordInteraction: () => {
    set({ lastInteraction: Date.now() });
  },

  autoIdle: () => {
    const state = get();
    const now = Date.now();
    const idleTime = now - state.lastInteraction;

    // Don't auto-idle if already in special states
    if (state.mood === "angry" || state.mood === "sleeping") {
      return;
    }

    if (idleTime >= IDLE_SLEEPING_THRESHOLD) {
      set({ mood: "sleeping", lastUpdated: now });
    } else if (idleTime >= IDLE_SLEEPY_THRESHOLD && state.mood !== "sleepy") {
      set({ mood: "sleepy", lastUpdated: now });
    }
  },

  reset: () => {
    const state = get();
    if (state.angerCooldownTimer) {
      clearTimeout(state.angerCooldownTimer);
    }
    set({
      mood: "neutral",
      energy: 70,
      lastUpdated: Date.now(),
      lastInteraction: Date.now(),
      angerCooldownTimer: undefined,
    });
  },
}));

// Helper function to detect mood from message content
export const detectMoodFromMessage = (message: string): Mood => {
  const lowerMsg = message.toLowerCase().trim();

  // Anger detection
  const angerWords = ['damn', 'shit', 'fuck', 'stupid', 'hate', 'idiot', 'wtf', 'ugh'];
  if (angerWords.some(word => lowerMsg.includes(word))) {
    return "angry";
  }

  // Compliments / Love
  const loveWords = ['love you', 'love u', 'adorable', 'cute', 'sweet', 'precious', 'best'];
  if (loveWords.some(phrase => lowerMsg.includes(phrase))) {
    return "loving";
  }

  // Greetings
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'sup'];
  if (greetings.some(word => lowerMsg.startsWith(word))) {
    return "welcoming";
  }

  // Excitement / Good news
  const excitementWords = ['amazing', 'awesome', 'fantastic', 'great news', 'wonderful', 'incredible', 'yay', 'woohoo', 'yes!'];
  const overjoyWords = ['best day ever', 'so happy', 'ecstatic', 'thrilled', 'cannot believe'];
  if (overjoyWords.some(phrase => lowerMsg.includes(phrase))) {
    return "overjoyed";
  }
  if (excitementWords.some(word => lowerMsg.includes(word))) {
    return "excited";
  }

  // Stress / Concern
  const stressWords = ['stressed', 'overwhelmed', 'anxious', 'worried', 'nervous', 'help', 'too much'];
  if (stressWords.some(word => lowerMsg.includes(word))) {
    return "concerned";
  }

  // Confusion / Worry
  const worryWords = ['confused', 'don\'t understand', 'what', 'why', 'how', 'unsure', 'lost'];
  if (worryWords.some(word => lowerMsg.includes(word))) {
    return "worried";
  }

  // Sadness
  const sadWords = ['sad', 'depressed', 'down', 'upset', 'crying', 'miss', 'lonely', 'hurt'];
  if (sadWords.some(word => lowerMsg.includes(word))) {
    return "sad";
  }

  // Tiredness
  const tiredWords = ['tired', 'sleepy', 'exhausted', 'worn out', 'need sleep', 'bed'];
  if (tiredWords.some(word => lowerMsg.includes(word))) {
    return "sleepy";
  }

  // Surprise
  const surpriseWords = ['wow', 'omg', 'no way', 'really', 'surprised', 'shocked', 'what!'];
  if (surpriseWords.some(word => lowerMsg.includes(word))) {
    return "surprised";
  }

  // Happy (general positive sentiment)
  const happyWords = ['happy', 'good', 'nice', 'glad', 'pleased', 'content', 'fine', 'okay'];
  if (happyWords.some(word => lowerMsg.includes(word))) {
    return "happy";
  }

  // Default to neutral
  return "neutral";
};

// Helper to determine mood from task context
export const detectMoodFromTaskContext = (params: {
  overdueCount?: number;
  completedToday?: number;
  notificationCount?: number;
}): Mood => {
  const { overdueCount = 0, completedToday = 0, notificationCount = 0 } = params;

  // Overwhelmed with notifications
  if (notificationCount > 10) {
    return "surprised2";
  }

  // Many tasks overdue (anxious)
  if (overdueCount > 5) {
    return "concerned";
  }

  // Completed many tasks today
  if (completedToday > 10) {
    return "overjoyed";
  } else if (completedToday > 5) {
    return "excited";
  }

  return "neutral";
};

// Auto-idle interval hook (call this in your main app component)
export const startAutoIdleCheck = () => {
  const interval = setInterval(() => {
    useMoodStore.getState().autoIdle();
  }, 30000); // Check every 30 seconds

  return () => clearInterval(interval);
};
