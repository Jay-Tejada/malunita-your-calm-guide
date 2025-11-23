import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatureSprite } from '@/components/CreatureSprite';
import { Sparkles } from 'lucide-react';
import type { EvolutionStage } from '@/lib/evolutionAssets';

interface EvolutionCutsceneProps {
  stage: EvolutionStage;
  onComplete: () => void;
}

export const EvolutionCutscene = ({ stage, onComplete }: EvolutionCutsceneProps) => {
  const [phase, setPhase] = useState<'glow' | 'scale' | 'burst' | 'reveal'>('glow');

  useEffect(() => {
    const timeline = [
      { delay: 0, phase: 'glow' as const },
      { delay: 600, phase: 'scale' as const },
      { delay: 1400, phase: 'burst' as const },
      { delay: 2400, phase: 'reveal' as const },
    ];

    const timers = timeline.map(({ delay, phase }) =>
      setTimeout(() => setPhase(phase), delay)
    );

    const completeTimer = setTimeout(onComplete, 3800);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const stageNames = {
    1: 'Baby',
    2: 'Youth',
    3: 'Teen',
    4: 'Adult',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      >
        {/* Radial glow effect */}
        <motion.div
          className="absolute inset-0"
          animate={
            phase === 'glow'
              ? {
                  background: [
                    'radial-gradient(circle, rgba(180,167,214,0) 0%, rgba(0,0,0,1) 100%)',
                    'radial-gradient(circle, rgba(180,167,214,0.3) 0%, rgba(0,0,0,1) 100%)',
                    'radial-gradient(circle, rgba(180,167,214,0.5) 0%, rgba(0,0,0,1) 100%)',
                  ],
                }
              : {}
          }
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        {/* Sparkle burst particles */}
        {phase === 'burst' && (
          <AnimatePresence>
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={`burst-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 2.5, 0],
                  x: [0, Math.cos((i / 24) * Math.PI * 2) * 300],
                  y: [0, Math.sin((i / 24) * Math.PI * 2) * 300],
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.02,
                  ease: 'easeOut',
                }}
                className="absolute top-1/2 left-1/2"
              >
                <Sparkles className="w-6 h-6 text-primary fill-primary" />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Creature animation */}
        <motion.div
          className="relative z-10"
          animate={
            phase === 'glow'
              ? {
                  filter: [
                    'brightness(1) drop-shadow(0 0 10px rgba(180,167,214,0.3))',
                    'brightness(1.5) drop-shadow(0 0 30px rgba(180,167,214,0.8))',
                  ],
                }
              : phase === 'scale'
              ? {
                  scale: [1, 1.4, 1.3],
                  filter: [
                    'brightness(1.5) drop-shadow(0 0 30px rgba(180,167,214,0.8))',
                    'brightness(3) drop-shadow(0 0 60px rgba(180,167,214,1))',
                    'brightness(2) drop-shadow(0 0 50px rgba(180,167,214,0.9))',
                  ],
                }
              : phase === 'burst'
              ? {
                  scale: [1.3, 1.6, 1],
                  rotate: [0, 10, -10, 0],
                  opacity: [1, 0.3, 1],
                }
              : {
                  scale: 1,
                  filter: 'brightness(1) drop-shadow(0 0 20px rgba(180,167,214,0.6))',
                }
          }
          transition={{
            duration:
              phase === 'glow' ? 0.6 : phase === 'scale' ? 0.8 : phase === 'burst' ? 1 : 0.4,
            ease: 'easeInOut',
          }}
        >
          <CreatureSprite emotion="overjoyed" size={200} animate />
        </motion.div>

        {/* Stage reveal text */}
        {phase === 'reveal' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center"
          >
            <motion.h2
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-4xl font-bold text-primary mb-2"
            >
              Evolution Complete!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground"
            >
              Now at Stage {stage}: {stageNames[stage]}
            </motion.p>
          </motion.div>
        )}

        {/* Orbital particles during reveal */}
        {phase === 'reveal' && (
          <AnimatePresence>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`orbit-${i}`}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.8, 0.8],
                  rotate: [0, 360],
                }}
                transition={{
                  opacity: { duration: 0.3 },
                  rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                }}
                className="absolute top-1/2 left-1/2"
                style={{
                  transformOrigin: `${Math.cos((i / 8) * Math.PI * 2) * 150}px ${
                    Math.sin((i / 8) * Math.PI * 2) * 150
                  }px`,
                }}
              >
                <div className="w-3 h-3 rounded-full bg-primary/60 blur-sm" />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
