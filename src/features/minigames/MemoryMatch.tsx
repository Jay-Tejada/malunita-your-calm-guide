import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { useLevelSystem } from '@/state/levelSystem';
import { useMoodStore } from '@/state/moodMachine';
import { CreatureSprite } from '@/components/CreatureSprite';
import { useToast } from '@/hooks/use-toast';
import { questTracker } from '@/lib/questTracker';

interface MemoryMatchProps {
  onComplete: () => void;
}

type Mood = 'happy' | 'calm' | 'angry' | 'sleepy' | 'excited' | 'anxious';

interface Tile {
  id: number;
  mood: Mood;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryMatch = ({ onComplete }: MemoryMatchProps) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const { adjustAffection } = useEmotionalMemory();
  const { grantXp } = useLevelSystem();
  const currentMood = useMoodStore((state) => state.mood);
  const { toast } = useToast();
  
  // Track quest on mount
  useEffect(() => {
    questTracker.trackMiniGame();
  }, []);

  // Mood affects flip speed
  const flipDuration = currentMood === 'excited' ? 0.2 : currentMood === 'sleepy' ? 0.5 : 0.3;

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const moods: Mood[] = ['happy', 'calm', 'angry', 'sleepy', 'excited', 'anxious'];
    const selectedMoods = moods.slice(0, 3); // Use 3 pairs = 6 tiles
    const pairs = [...selectedMoods, ...selectedMoods];
    
    const shuffled = pairs
      .sort(() => Math.random() - 0.5)
      .map((mood, index) => ({
        id: index,
        mood,
        isFlipped: false,
        isMatched: false,
      }));

    setTiles(shuffled);
  };

  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [first, second] = flippedIndices;
      setMoves((prev) => prev + 1);

      if (tiles[first].mood === tiles[second].mood) {
        // Match found!
        setTiles((prev) =>
          prev.map((tile, i) =>
            i === first || i === second ? { ...tile, isMatched: true } : tile
          )
        );
        setMatchedCount((prev) => prev + 1);
        setFlippedIndices([]);

        // Check if all matched
        if (matchedCount + 1 === tiles.length / 2) {
          setTimeout(() => {
            adjustAffection(10);
            grantXp(20);
            toast({
              title: "You matched them all! 🎉",
              description: "+10 affection, +20 XP",
            });
            onComplete();
          }, 1000);
        }
      } else {
        // No match, flip back after delay
        setTimeout(() => {
          setTiles((prev) =>
            prev.map((tile, i) =>
              i === first || i === second ? { ...tile, isFlipped: false } : tile
            )
          );
          setFlippedIndices([]);
        }, 1000);
      }
    }
  }, [flippedIndices, tiles, matchedCount, adjustAffection, grantXp, toast, onComplete]);

  const handleTileClick = (index: number) => {
    if (
      flippedIndices.length >= 2 ||
      tiles[index].isFlipped ||
      tiles[index].isMatched
    ) {
      return;
    }

    setTiles((prev) =>
      prev.map((tile, i) =>
        i === index ? { ...tile, isFlipped: true } : tile
      )
    );
    setFlippedIndices((prev) => [...prev, index]);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex justify-between w-full">
        <div className="text-lg font-semibold">Moves: {moves}</div>
        <div className="text-lg font-semibold">Matched: {matchedCount}/{tiles.length / 2}</div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        {tiles.map((tile, index) => (
          <motion.div
            key={tile.id}
            whileHover={{ scale: tile.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: tile.isMatched ? 1 : 0.95 }}
          >
            <Card
              className={`h-32 flex items-center justify-center cursor-pointer relative overflow-hidden transition-all ${
                tile.isMatched
                  ? 'bg-primary/20 border-primary'
                  : tile.isFlipped
                  ? 'bg-card border-primary/50'
                  : 'bg-card/50 backdrop-blur-sm border-border'
              }`}
              onClick={() => handleTileClick(index)}
            >
              <AnimatePresence mode="wait">
                {(tile.isFlipped || tile.isMatched) ? (
                  <motion.div
                    key="front"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: flipDuration }}
                    className="w-20 h-20"
                  >
                    <CreatureSprite emotion={tile.mood} size={80} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: flipDuration }}
                    className="text-4xl"
                  >
                    ?
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
