import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatureSprite } from '@/components/CreatureSprite';
import { useMoodStore } from '@/state/moodMachine';
import { Heart } from 'lucide-react';

interface AssistantBubbleProps {
  onOpenChat?: () => void;
  className?: string;
}

const AssistantBubble = ({ onOpenChat, className = '' }: AssistantBubbleProps) => {
  const { mood, updateMood, recordInteraction } = useMoodStore();
  const [idleAnimation, setIdleAnimation] = useState<'none' | 'wink' | 'bounce' | 'look'>('none');
  const [showHearts, setShowHearts] = useState(false);

  // Idle cycle behavior - random animations every 15-25 seconds
  useEffect(() => {
    // Don't idle-cycle during these moods
    if (mood === 'sleeping' || mood === 'angry' || mood === 'worried' || mood === 'sad') {
      return;
    }

    const scheduleNextIdle = () => {
      const delay = 15000 + Math.random() * 10000; // 15-25 seconds
      return setTimeout(() => {
        const animations: Array<'wink' | 'bounce' | 'look'> = ['wink', 'bounce', 'look'];
        const randomAnim = animations[Math.floor(Math.random() * animations.length)];
        setIdleAnimation(randomAnim);

        // Reset after animation plays
        setTimeout(() => setIdleAnimation('none'), 1000);
        
        scheduleNextIdle();
      }, delay);
    };

    const timer = scheduleNextIdle();
    return () => clearTimeout(timer);
  }, [mood]);

  // Heart particles when mood is loving
  useEffect(() => {
    if (mood === 'loving') {
      setShowHearts(true);
      const timer = setTimeout(() => setShowHearts(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [mood]);

  // Poke to wake handler
  const handleClick = useCallback(() => {
    recordInteraction();

    // Poke to wake logic
    if (mood === 'sleeping') {
      updateMood('surprised2');
    } else if (mood === 'sleepy') {
      updateMood('neutral');
    } else if (onOpenChat) {
      onOpenChat();
    }
  }, [mood, updateMood, recordInteraction, onOpenChat]);

  // Animation classes based on idle state
  const getAnimationClass = () => {
    switch (idleAnimation) {
      case 'bounce':
        return 'animate-[bounce_0.5s_ease-in-out]';
      case 'wink':
        return 'animate-[pulse_0.3s_ease-in-out]';
      case 'look':
        return 'animate-[swing_0.6s_ease-in-out]';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`fixed bottom-6 right-6 z-50 cursor-pointer select-none ${className}`}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Container with glow effect */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        
        {/* Main bubble */}
        <div className={`relative bg-background/80 backdrop-blur-sm rounded-full p-3 shadow-2xl border-2 border-primary/30 ${getAnimationClass()}`}>
          <CreatureSprite
            emotion={mood}
            size={90}
            animate={mood === 'neutral' || mood === 'happy'}
          />
        </div>

        {/* Heart particles when loving */}
        <AnimatePresence>
          {showHearts && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1, 
                    y: 0, 
                    x: 0,
                    scale: 0.5
                  }}
                  animate={{ 
                    opacity: 0, 
                    y: -60 - (i * 10), 
                    x: (Math.random() - 0.5) * 40,
                    scale: 1
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 2, 
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                  className="absolute top-0 left-1/2 -translate-x-1/2"
                >
                  <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Status indicator dot */}
        <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
      </div>
    </motion.div>
  );
};

export default AssistantBubble;
