import confetti from 'canvas-confetti';
import { hapticMedium, hapticSuccess } from '@/utils/haptics';

export const celebrations = {
  // Task completed
  taskComplete: () => {
    hapticMedium();
    
    // Small confetti burst
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { y: 0.6 },
      colors: ['hsl(var(--primary))', 'hsl(var(--primary) / 0.8)', 'hsl(var(--primary) / 0.6)']
    });
  },
  
  // Inbox zero achieved
  inboxZero: () => {
    hapticSuccess();
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#34D399', '#6EE7B7']
    });
  },
  
  // ONE thing completed
  oneThingComplete: () => {
    hapticSuccess();
    
    // Fireworks effect
    const duration = 2000;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#F59E0B', '#FBBF24', '#FCD34D']
      });
      
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#F59E0B', '#FBBF24', '#FCD34D']
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  },
  
  // Streak milestone (3, 5, 7 days)
  streakMilestone: (days: number) => {
    hapticSuccess();
    
    confetti({
      particleCount: days * 20,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#EC4899', '#F472B6', '#FBCFE8']
    });
  },
  
  // Level up
  levelUp: () => {
    hapticSuccess();
    
    // Continuous confetti for 3 seconds
    const duration = 3000;
    const end = Date.now() + duration;
    
    const colors = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#F59E0B', '#FBBF24'];
    
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      });
      
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  },
  
  // Simple success (for saves, updates)
  success: () => {
    hapticMedium();
  },

  // Multiple tasks completed in quick succession
  taskStreak: (count: number) => {
    hapticSuccess();
    
    confetti({
      particleCount: count * 15,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#EC4899', '#F59E0B']
    });
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
