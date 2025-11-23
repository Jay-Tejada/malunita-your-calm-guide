import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLevelSystem } from '@/state/levelSystem';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { Sparkles } from 'lucide-react';
import { getCreatureAsset, getStageBoosts } from '@/lib/evolutionAssets';
import { useMoodStore } from '@/state/moodMachine';
import { useBondingMeter } from '@/hooks/useBondingMeter';
import { useArtStyleStore } from '@/features/artstyles/useArtStyleStore';
import { ART_STYLES } from '@/features/artstyles/artStyleConfig';

type AnimationMode = 
  | 'floating_idle' 
  | 'walking' 
  | 'turning_left' 
  | 'turning_right' 
  | 'falling_asleep' 
  | 'waking_up' 
  | 'excited_bounce'
  | 'sleeping_loop'
  | 'evolution_flash'
  | 'none';

interface CreatureSpriteProps {
  emotion: string;             // determines the sprite to display
  size?: number;               // default 160px
  animate?: boolean;           // enables idle bounce animation
  className?: string;          // extra classes
  listening?: boolean;         // shows listening animation
  typing?: boolean;            // shows typing/thinking state
  onWakeUp?: () => void;       // callback when creature wakes up
}

// This mapping is now handled by evolutionAssets.ts

export const CreatureSprite = ({ 
  emotion, 
  size = 160, 
  animate = false, 
  className,
  listening = false,
  typing = false,
  onWakeUp
}: CreatureSpriteProps) => {
  const [microEmotion, setMicroEmotion] = useState<string | null>(null);
  const [animationMode, setAnimationMode] = useState<AnimationMode>('floating_idle');
  const [showSparkles, setShowSparkles] = useState(false);
  const { level, evolutionStage } = useLevelSystem();
  const { joy } = useEmotionalMemory();
  const { updateMood } = useMoodStore();
  const { bonding, trackMalunitaTap } = useBondingMeter();
  const { currentStyle, isTransitioning } = useArtStyleStore();
  const prevEmotionRef = useRef(emotion);
  const prevStageRef = useRef(evolutionStage);
  const prevStyleRef = useRef(currentStyle);
  
  // Soul-Bond special effect
  const isSoulBond = bonding.tier.name === "Soul-Bond";
  
  // Get current art style config
  const artStyleConfig = ART_STYLES[currentStyle];
  
  // Get stage-specific boosts
  const stageBoosts = getStageBoosts(evolutionStage);
  
  // Calculate visual enhancements based on level and stage
  const brightness = 1 + (level - 1) * 0.02; // 1.0 to 1.38 at level 20
  const glowIntensity = (level >= 10 ? 0.3 + (level - 10) * 0.03 : 0) * stageBoosts.glowMultiplier;
  const hasParticles = level >= 10;
  const particleCount = stageBoosts.particleCount;
  const isHappy = joy >= 70;

  // Art style change animation
  useEffect(() => {
    if (currentStyle !== prevStyleRef.current) {
      // Trigger spin & blink animation when style changes
      setAnimationMode('evolution_flash');
      
      setTimeout(() => {
        setAnimationMode('floating_idle');
      }, 600);
    }
    prevStyleRef.current = currentStyle;
  }, [currentStyle]);
  
  // Evolution animation
  useEffect(() => {
    if (evolutionStage > prevStageRef.current) {
      // Trigger evolution animation
      setAnimationMode('evolution_flash');
      updateMood('overjoyed');
      
      setTimeout(() => {
        setAnimationMode('floating_idle');
      }, 2000);
    }
    prevStageRef.current = evolutionStage;
  }, [evolutionStage, updateMood]);

  // Sleeping state transitions
  useEffect(() => {
    if (emotion === 'sleeping' && prevEmotionRef.current !== 'sleeping') {
      // Transition to sleeping
      setAnimationMode('falling_asleep');
      setTimeout(() => setAnimationMode('sleeping_loop'), 1000);
    } else if (emotion === 'surprised2' && prevEmotionRef.current === 'sleeping') {
      // Waking up from sleep
      setAnimationMode('waking_up');
      setTimeout(() => {
        setAnimationMode('floating_idle');
        onWakeUp?.();
      }, 800);
    } else if (emotion !== 'sleeping' && animationMode === 'sleeping_loop') {
      setAnimationMode('floating_idle');
    }
    
    prevEmotionRef.current = emotion;
  }, [emotion, animationMode, onWakeUp]);

  // Bounce on strong mood changes
  useEffect(() => {
    const strongMoods = ['overjoyed', 'excited', 'angry', 'surprised', 'surprised2'];
    if (strongMoods.includes(emotion) && prevEmotionRef.current !== emotion) {
      setAnimationMode('excited_bounce');
      setTimeout(() => setAnimationMode('floating_idle'), 400);
    }
  }, [emotion]);

  // Random idle animation events (adjusted by stage)
  useEffect(() => {
    // Skip idle animations for strong emotions, when listening, or when typing
    if (listening || typing || ['angry', 'sleeping', 'sad'].includes(emotion)) {
      return;
    }

    const scheduleIdle = () => {
      // Frequency increases with evolution stage
      const baseDelay = 20000;
      const delay = baseDelay + Math.random() * 25000 / stageBoosts.microEmotionFrequency;
      return setTimeout(() => {
        const idleActions: AnimationMode[] = ['turning_left', 'turning_right', 'walking'];
        const randomAction = idleActions[Math.floor(Math.random() * idleActions.length)];
        
        setAnimationMode(randomAction);
        
        // Also trigger micro-expression
        const expressions = ['winking', 'welcoming', 'concerned'];
        setMicroEmotion(expressions[Math.floor(Math.random() * expressions.length)]);
        
        // Reset after animation completes
        setTimeout(() => {
          setAnimationMode('floating_idle');
          setMicroEmotion(null);
        }, randomAction === 'walking' ? 1500 : 800);
        
        scheduleIdle();
      }, delay);
    };

    const timer = scheduleIdle();
    return () => clearTimeout(timer);
  }, [emotion, listening, typing, stageBoosts]);

  // Sparkles for high happiness
  useEffect(() => {
    if (isHappy && !listening && !typing) {
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isHappy, listening, typing]);

  // Determine expression to show
  const getDisplayEmotion = () => {
    // Typing state takes precedence
    if (typing) {
      if (emotion === 'angry') return 'worried';
      if (emotion === 'sleepy' || emotion === 'sleeping') return 'sleepy';
      return 'concerned'; // Default thinking expression
    }
    
    // Listening state
    if (listening) {
      return Math.random() > 0.5 ? 'welcoming' : 'laughing';
    }
    
    // Normal state - use micro-expression or main emotion
    return microEmotion ?? emotion;
  };
  
  const finalEmotion = getDisplayEmotion();
  const imageSrc = getCreatureAsset(evolutionStage, finalEmotion);

  // Animation variants for framer-motion
  const getAnimationVariants = () => {
    switch (animationMode) {
      case 'floating_idle':
        return {
          animate: {
            y: [0, -6, 0],
            rotate: [-1, 1, -1],
          },
          transition: { duration: stageBoosts.idleCycleDuration / 1000, repeat: Infinity }
        };
      case 'evolution_flash':
        return {
          animate: {
            opacity: [1, 0, 1, 0.5, 1],
            scale: [1, 1.3, 1.4, 1.2, 1],
            filter: [
              'brightness(1)',
              'brightness(3)',
              'brightness(2)',
              'brightness(1.5)',
              'brightness(1)',
            ],
          },
          transition: { duration: 2 }
        };
      case 'walking':
        return {
          animate: {
            y: [0, -4, 0, -4, 0],
            x: [0, 2, 0, -2, 0],
          },
          transition: { duration: 1.5 }
        };
      case 'turning_left':
        return {
          animate: {
            rotate: [-2, -8, -2],
            x: [0, -3, 0],
          },
          transition: { duration: 0.8 }
        };
      case 'turning_right':
        return {
          animate: {
            rotate: [-2, 8, -2],
            x: [0, 3, 0],
          },
          transition: { duration: 0.8 }
        };
      case 'falling_asleep':
        return {
          animate: {
            y: 8,
            rotate: -15,
            scale: 0.95,
            opacity: 0.8,
          },
          transition: { duration: 1 }
        };
      case 'sleeping_loop':
        return {
          animate: {
            y: [8, 10, 8],
            rotate: [-15, -14, -15],
            scale: 0.95,
            opacity: 0.8,
          },
          transition: { duration: 4, repeat: Infinity }
        };
      case 'waking_up':
        return {
          animate: {
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1,
          },
          transition: { duration: 0.8 }
        };
      case 'excited_bounce':
        return {
          animate: {
            y: [0, -12, 0],
            scale: [1, 1.05, 1],
          },
          transition: { duration: 0.4 }
        };
      default:
        return {
          animate: {},
          transition: {}
        };
    }
  };

  const animationConfig = getAnimationVariants();

  return (
    <motion.div 
      className={cn(
        "flex items-center justify-center relative cursor-pointer",
        listening && "shadow-lg shadow-white/40",
        className
      )}
      style={{ width: size, height: size }}
      animate={animationConfig.animate}
      transition={animationConfig.transition}
      onClick={trackMalunitaTap}
    >
      {/* Level-based glow effect */}
      {glowIntensity > 0 && (
        <div 
          className="absolute inset-0 rounded-full blur-xl animate-pulse pointer-events-none"
          style={{ 
            background: `radial-gradient(circle, hsl(var(--primary) / ${glowIntensity}) 0%, transparent 70%)` 
          }}
        />
      )}

      {/* Particle effects for level 10+ (count varies by stage) */}
      {hasParticles && particleCount > 0 && (
        <AnimatePresence>
          {[...Array(particleCount)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{ 
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0],
                y: [-20, -40, -60],
                x: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 50]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-primary/60"
            />
          ))}
        </AnimatePresence>
      )}

      {/* Sparkles for high happiness (joy >= 70) */}
      {showSparkles && (
        <AnimatePresence>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
                x: [0, (Math.random() - 0.5) * 60],
                y: [0, (Math.random() - 0.5) * 60]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2"
            >
              <Sparkles className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Soul-Bond golden sparkles */}
      {isSoulBond && (
        <AnimatePresence>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`soul-sparkle-${i}`}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ 
                opacity: [0, 0.8, 0],
                scale: [0, 1.2, 0],
                rotate: [0, 360],
                x: [0, (Math.random() - 0.5) * 80],
                y: [0, (Math.random() - 0.5) * 80]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2"
            >
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Evolution sparkle burst */}
      {animationMode === 'evolution_flash' && (
        <AnimatePresence>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`evo-sparkle-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 2, 0],
                x: [0, Math.cos((i / 12) * Math.PI * 2) * 80],
                y: [0, Math.sin((i / 12) * Math.PI * 2) * 80]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.05,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2"
            >
              <Sparkles className="w-4 h-4 text-primary fill-primary" />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${evolutionStage}-${imageSrc}-${currentStyle}`}
          initial={{ opacity: 0, scale: 0.95, rotate: isTransitioning ? -10 : 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.95, rotate: isTransitioning ? 10 : 0 }}
          transition={{ duration: isTransitioning ? 0.3 : 0.25, ease: "easeOut" }}
          className="w-full h-full flex items-center justify-center relative z-10"
        >
          <img
            src={imageSrc}
            alt={`Creature ${emotion} expression (Stage ${evolutionStage})`}
            className="w-full h-full object-contain"
            style={{ 
              imageRendering: 'crisp-edges',
              filter: `brightness(${brightness}) ${artStyleConfig.cssFilter || ''}`,
            }}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
