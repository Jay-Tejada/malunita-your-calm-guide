import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { useMoodStore } from '@/state/moodMachine';
import { CreatureSprite } from '@/components/CreatureSprite';
import { questTracker } from '@/lib/questTracker';

interface PeekABooProps {
  onComplete: () => void;
}

export const PeekABoo = ({ onComplete }: PeekABooProps) => {
  const [hidingSpot, setHidingSpot] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFound, setIsFound] = useState(false);
  const { adjustAffection } = useEmotionalMemory();
  const mood = useMoodStore((state) => state.mood);
  
  // Track quest on mount
  useEffect(() => {
    questTracker.trackMiniGame();
  }, []);

  // Mood affects hiding speed
  const hideSpeed = mood === 'excited' ? 1500 : mood === 'sleepy' ? 3000 : 2000;

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  useEffect(() => {
    const hideInterval = setInterval(() => {
      if (!isFound) {
        setHidingSpot(Math.floor(Math.random() * 6));
      }
    }, hideSpeed);

    return () => clearInterval(hideInterval);
  }, [hideSpeed, isFound]);

  useEffect(() => {
    if (isFound) {
      const timeout = setTimeout(() => {
        setIsFound(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isFound]);

  const handleCardClick = (index: number) => {
    if (index === hidingSpot && !isFound) {
      setScore((prev) => prev + 1);
      adjustAffection(5);
      setIsFound(true);
      setHidingSpot(Math.floor(Math.random() * 6));
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex justify-between w-full">
        <div className="text-lg font-semibold">Score: {score}</div>
        <div className="text-lg font-semibold">Time: {timeLeft}s</div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className="h-32 flex items-center justify-center cursor-pointer relative overflow-hidden bg-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transition-colors"
              onClick={() => handleCardClick(index)}
            >
              <AnimatePresence>
                {index === hidingSpot && !isFound && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-20 h-20">
                      <CreatureSprite emotion={mood} size={80} />
                    </div>
                  </motion.div>
                )}
                {index === hidingSpot && isFound && (
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 0], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="absolute text-4xl"
                  >
                    ✨
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      <Button onClick={onComplete} variant="outline" className="mt-4">
        Finish Game
      </Button>
    </div>
  );
};
