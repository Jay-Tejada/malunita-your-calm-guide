import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatureSprite } from '@/components/CreatureSprite';
import { Heart, Sun, Moon } from 'lucide-react';

interface RitualCompleteCutsceneProps {
  type: 'morning' | 'evening';
  onComplete: () => void;
}

export const RitualCompleteCutscene = ({ type, onComplete }: RitualCompleteCutsceneProps) => {
  const [phase, setPhase] = useState<'fade' | 'glow' | 'celebrate'>('fade');

  useEffect(() => {
    const timeline = [
      { delay: 0, phase: 'fade' as const },
      { delay: 800, phase: 'glow' as const },
      { delay: 1800, phase: 'celebrate' as const },
    ];

    const timers = timeline.map(({ delay, phase }) =>
      setTimeout(() => setPhase(phase), delay)
    );

    const completeTimer = setTimeout(onComplete, 3000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const isMorning = type === 'morning';
  const bgGradient = isMorning
    ? 'from-orange-300/20 via-yellow-200/20 to-pink-300/20'
    : 'from-indigo-400/20 via-purple-300/20 to-blue-400/20';

  const Icon = isMorning ? Sun : Moon;
  const title = isMorning ? 'Morning Ritual Complete' : 'Evening Reflection Complete';
  const message = isMorning
    ? 'Ready to conquer the day!'
    : 'Rest well, tomorrow awaits!';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br ${bgGradient} backdrop-blur-sm`}
      >
        {/* Soft radial background glow */}
        <motion.div
          className="absolute inset-0"
          animate={
            phase === 'fade'
              ? {
                  opacity: [0, 0.3],
                }
              : phase === 'glow'
              ? {
                  opacity: [0.3, 0.6],
                }
              : {
                  opacity: [0.6, 0.4],
                }
          }
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            background: isMorning
              ? 'radial-gradient(circle at center, rgba(255,193,7,0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(149,117,205,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Floating particles */}
        {phase === 'glow' && (
          <AnimatePresence>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                initial={{ opacity: 0, scale: 0, y: 50 }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0, 1.2, 0],
                  y: [50, -100, -150],
                  x: [(Math.random() - 0.5) * 100],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.15,
                  ease: 'easeOut',
                }}
                className="absolute bottom-0 left-1/2"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isMorning ? 'bg-yellow-400/80' : 'bg-purple-400/80'
                  }`}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Creature */}
        <motion.div
          className="relative z-10"
          animate={
            phase === 'fade'
              ? {
                  opacity: [0, 1],
                  scale: [0.8, 1],
                }
              : phase === 'glow'
              ? {
                  filter: [
                    'brightness(1)',
                    'brightness(1.3)',
                    'brightness(1)',
                  ],
                }
              : {
                  y: [0, -10, 0],
                }
          }
          transition={{
            duration: phase === 'fade' ? 0.8 : phase === 'glow' ? 1 : 1.2,
            ease: 'easeInOut',
          }}
        >
          <CreatureSprite emotion="loving" size={160} animate />
        </motion.div>

        {/* Ritual icon orbiting around creature */}
        {phase === 'glow' && (
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-0 left-1/2 -translate-x-1/2"
            >
              <Icon
                className={`w-6 h-6 ${
                  isMorning ? 'text-yellow-400' : 'text-purple-400'
                }`}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Title and message */}
        {phase === 'celebrate' && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center max-w-md px-4"
          >
            <motion.h2
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-3xl font-bold text-foreground mb-3"
            >
              {title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              {message}
            </motion.p>

            {/* Hearts floating up */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`heart-${i}`}
                  initial={{ opacity: 0, y: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: [0, -40],
                    scale: [0, 1, 0.8],
                    x: [0, (Math.random() - 0.5) * 30],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.3,
                    ease: 'easeOut',
                  }}
                  className="absolute"
                >
                  <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Background light rays */}
        {phase === 'glow' && isMorning && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`ray-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.15, 0] }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
                className="absolute top-0 left-1/2"
                style={{
                  width: '2px',
                  height: '100%',
                  background:
                    'linear-gradient(to bottom, rgba(255,215,0,0.5) 0%, transparent 50%)',
                  transform: `rotate(${(i / 6) * 360}deg) translateY(-50%)`,
                  transformOrigin: 'top center',
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
