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
        return 'duration-[400ms]'; // Faster
      case 'sleepy':
      case 'sleeping':
        return 'duration-[1200ms]'; // Very slow
      case 'angry':
        return 'duration-500';
      default:
        return 'duration-[600ms]'; // Normal
    }
  };

  const speed = getAnimationSpeed();
  const isLoving = mood === 'loving';

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {isLoving ? (
        // Hearts for loving mood
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`animate-typing-dot ${speed}`}
              style={{ 
                animationDelay: `${i * 200}ms`,
              }}
            >
              <Heart className="w-2.5 h-2.5 text-primary fill-primary" />
            </div>
          ))}
        </>
      ) : (
        // Regular dots for other moods
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full bg-primary animate-typing-dot ${speed}`}
              style={{ 
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};
