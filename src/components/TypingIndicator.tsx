import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { Mood } from '@/state/moodMachine';

interface TypingIndicatorProps {
  mood?: Mood;
  className?: string;
}

export const TypingIndicator = ({ mood = 'neutral', className = '' }: TypingIndicatorProps) => {
  // Adjust animation speed based on mood
  const getAnimationSpeed = () => {
    switch (mood) {
      case 'excited':
      case 'overjoyed':
        return 0.4; // Faster
      case 'sleepy':
      case 'sleeping':
        return 1.2; // Very slow
      case 'angry':
        return 0.5;
      default:
        return 0.6; // Normal
    }
  };

  const speed = getAnimationSpeed();
  const isLoving = mood === 'loving';

  const dotVariants = {
    initial: { opacity: 0.3, y: 0 },
    animate: { opacity: 1, y: -8 }
  };

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {isLoving ? (
        // Hearts for loving mood
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: speed,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * (speed / 3),
                ease: "easeInOut"
              }}
            >
              <Heart className="w-2.5 h-2.5 text-primary fill-primary" />
            </motion.div>
          ))}
        </>
      ) : (
        // Regular dots for other moods
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: speed,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * (speed / 3),
                ease: "easeInOut"
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </>
      )}
    </div>
  );
};
