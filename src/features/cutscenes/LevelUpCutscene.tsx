import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatureSprite } from '@/components/CreatureSprite';
import { Sparkles, Star } from 'lucide-react';

interface LevelUpCutsceneProps {
  level: number;
  onComplete: () => void;
}

export const LevelUpCutscene = ({ level, onComplete }: LevelUpCutsceneProps) => {
  const [phase, setPhase] = useState<'orbs' | 'levelup' | 'celebrate'>('orbs');

  useEffect(() => {
    const timeline = [
      { delay: 0, phase: 'orbs' as const },
      { delay: 1000, phase: 'levelup' as const },
      { delay: 2000, phase: 'celebrate' as const },
    ];

    const timers = timeline.map(({ delay, phase }) =>
      setTimeout(() => setPhase(phase), delay)
    );

    const completeTimer = setTimeout(onComplete, 3200);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black/95 via-primary/20 to-black/95 backdrop-blur-sm"
      >
        {/* XP Orbs swirling in */}
        {phase === 'orbs' && (
          <AnimatePresence>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`orb-${i}`}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: Math.cos((i / 12) * Math.PI * 2) * 400,
                  y: Math.sin((i / 12) * Math.PI * 2) * 400,
                }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.5, 1, 0],
                  x: [
                    Math.cos((i / 12) * Math.PI * 2) * 400,
                    Math.cos((i / 12) * Math.PI * 2) * 150,
                    0,
                  ],
                  y: [
                    Math.sin((i / 12) * Math.PI * 2) * 400,
                    Math.sin((i / 12) * Math.PI * 2) * 150,
                    0,
                  ],
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.05,
                  ease: 'easeInOut',
                }}
                className="absolute top-1/2 left-1/2"
              >
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Creature */}
        <motion.div
          className="relative z-10"
          animate={
            phase === 'orbs'
              ? { scale: 1 }
              : phase === 'levelup'
              ? {
                  scale: [1, 1.2, 1.15],
                  y: [0, -20, -15],
                }
              : {
                  y: [-15, 0],
                  rotate: [0, 5, -5, 0],
                }
          }
          transition={{
            duration: phase === 'levelup' ? 0.6 : 0.8,
            ease: 'easeOut',
          }}
        >
          <CreatureSprite emotion="excited" size={180} animate />
        </motion.div>

        {/* Level Up Text */}
        {phase === 'levelup' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{
              opacity: 1,
              scale: [0.5, 1.3, 1],
              y: [100, -30, 0],
            }}
            transition={{
              duration: 0.8,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2"
          >
            <div className="text-center">
              <motion.div
                animate={{
                  textShadow: [
                    '0 0 20px rgba(255,215,0,0.8)',
                    '0 0 40px rgba(255,215,0,1)',
                    '0 0 20px rgba(255,215,0,0.8)',
                  ],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-6xl font-bold text-yellow-400 mb-2"
                style={{
                  textShadow: '0 0 20px rgba(255,215,0,0.8)',
                }}
              >
                LEVEL UP!
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Level number reveal */}
        {phase === 'celebrate' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-5xl font-bold text-primary mb-2"
            >
              Level {level}
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Keep growing stronger!
            </motion.p>
          </motion.div>
        )}

        {/* Celebration sparkles */}
        {phase === 'celebrate' && (
          <AnimatePresence>
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  rotate: [0, 180, 360],
                  x: [0, (Math.random() - 0.5) * 300],
                  y: [0, (Math.random() - 0.5) * 300],
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
                className="absolute top-1/2 left-1/2"
              >
                <Sparkles className="w-4 h-4 text-primary fill-primary" />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
