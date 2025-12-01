import { hapticMedium, hapticSuccess } from '@/utils/haptics';

export const celebrations = {
  // Task completed
  taskComplete: () => {
    hapticMedium();
  },
  
  // Inbox zero achieved
  inboxZero: () => {
    hapticSuccess();
  },
  
  // ONE thing completed
  oneThingComplete: () => {
    hapticSuccess();
  },
  
  // Streak milestone (3, 5, 7 days)
  streakMilestone: (days: number) => {
    hapticSuccess();
  },
  
  // Level up
  levelUp: () => {
    hapticSuccess();
  },
  
  // Simple success (for saves, updates)
  success: () => {
    hapticMedium();
  },

  // Multiple tasks completed in quick succession
  taskStreak: (count: number) => {
    hapticSuccess();
  }
};

// Toast messages with personality
export const celebrationToasts = {
  taskComplete: [
    "Nice! ✨",
    "One down! 🎯",
    "Got it! ✓",
    "Progress! 💪",
    "Nailed it! 🔥"
  ],
  
  oneThingComplete: [
    "Your ONE thing is done! 🌟",
    "Priority completed! 🎉",
    "That was your focus - crushed it! ✨",
    "Main goal achieved! 🎯"
  ],
  
  inboxZero: [
    "Inbox zero! You're unstoppable 🚀",
    "All clear! Feeling organized? ✨",
    "Clean inbox = clear mind 🧘",
    "You cleared it all! 🎉"
  ],
  
  streak: (days: number) => [
    `${days} day streak! 🔥`,
    `Keep it going - ${days} days! 💪`,
    `${days} days in a row! Impressive! ⚡`
  ],

  taskStreak: (count: number) => [
    `${count} in a row! On fire! 🔥`,
    `${count} tasks crushed! 💪`,
    `${count} task streak! Unstoppable! ⚡`
  ]
};

// Get random toast message
export function getRandomToast(type: keyof typeof celebrationToasts, param?: number): string {
  const messages = (type === 'streak' || type === 'taskStreak') && param 
    ? celebrationToasts[type](param)
    : celebrationToasts[type as 'taskComplete' | 'oneThingComplete' | 'inboxZero'];
  
  return messages[Math.floor(Math.random() * messages.length)];
}
