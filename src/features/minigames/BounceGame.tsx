import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { useLevelSystem } from '@/state/levelSystem';
import { useMoodStore } from '@/state/moodMachine';
import { CreatureSprite } from '@/components/CreatureSprite';
import { useToast } from '@/hooks/use-toast';

interface BounceGameProps {
  onComplete: () => void;
}

export const BounceGame = ({ onComplete }: BounceGameProps) => {
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const { adjustJoy } = useEmotionalMemory();
  const { grantXp } = useLevelSystem();
  const mood = useMoodStore((state) => state.mood);
  const { toast } = useToast();
  const animationFrameRef = useRef<number>();

  // Mood affects bounce speed
  const bounceSpeed = mood === 'excited' ? 0.08 : mood === 'sleepy' ? 0.03 : 0.05;

  useEffect(() => {
    const animate = () => {
      setPosition((prev) => {
        const newPos = prev + direction * bounceSpeed;
        if (newPos >= 1 || newPos <= 0) {
          setDirection((d) => -d);
          return Math.max(0, Math.min(1, newPos));
        }
        return newPos;
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [direction, bounceSpeed]);

  const handleTap = () => {
    setAttempts((prev) => prev + 1);

    // Perfect timing at peak (position near 1) or bottom (position near 0)
    const isPerfect = position >= 0.9 || position <= 0.1;
    const isGood = position >= 0.8 || position <= 0.2;

    if (isPerfect) {
      setScore((prev) => prev + 1);
      adjustJoy(5);
      grantXp(8);
      toast({
        title: "Perfect! ✨",
        description: "+5 joy, +8 XP",
      });
    } else if (isGood) {
      setScore((prev) => prev + 1);
      adjustJoy(3);
      grantXp(5);
      toast({
        title: "Good timing! 🌟",
        description: "+3 joy, +5 XP",
      });
    }

    if (attempts >= 9) {
      setTimeout(() => onComplete(), 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="flex justify-between w-full">
        <div className="text-lg font-semibold">Perfect Taps: {score}</div>
        <div className="text-lg font-semibold">Attempts: {attempts}/10</div>
      </div>

      <div className="relative w-full max-w-md h-96 bg-card/30 backdrop-blur-sm border-2 border-border rounded-lg overflow-hidden">
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-24 h-24"
          style={{
            top: `${position * 80 + 10}%`,
          }}
          animate={{
            scale: position >= 0.9 || position <= 0.1 ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <CreatureSprite emotion={mood} size={96} />
        </motion.div>

        {/* Target zones */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-primary/10 border-b-2 border-primary/30">
          <div className="text-center text-sm text-primary font-semibold pt-2">
            TAP ZONE ⭐
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-primary/10 border-t-2 border-primary/30">
          <div className="text-center text-sm text-primary font-semibold pt-2">
            TAP ZONE ⭐
          </div>
        </div>
      </div>

      <Button
        onClick={handleTap}
        size="lg"
        className="w-full max-w-md"
        disabled={attempts >= 10}
      >
        TAP NOW! 👆
      </Button>

      <Button onClick={onComplete} variant="outline" size="sm">
        Finish Game
      </Button>
    </div>
  );
};
