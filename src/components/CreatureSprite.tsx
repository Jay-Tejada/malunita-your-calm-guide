import { useState, useEffect } from 'react';
import { getExpressionAsset } from '@/utils/getExpressionAsset';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLevelSystem } from '@/state/levelSystem';

// Import all expression assets
import baseExpression from '@/assets/companions/base_expression.png';
import baseHappyExpression from '@/assets/companions/base_happy_expression.png';
import excitedExpression from '@/assets/companions/excited_expression.png';
import overjoyedExpression from '@/assets/companions/overjoyed_expression.png';
import happy2Expression from '@/assets/companions/happy_2_expression.png';
import happyToSeeYouExpression from '@/assets/companions/happy_to_see_you_expression.png';
import loveExpression from '@/assets/companions/love_expression.png';
import winkingExpression from '@/assets/companions/winking_expression.png';
import surprisedExpression from '@/assets/companions/surprised_expression.png';
import surprised2Expression from '@/assets/companions/surprised_2_expression.png';
import concernedExpression from '@/assets/companions/concerned_expression.png';
import whyExpression from '@/assets/companions/why_expression.png';
import lowEnergyExpression from '@/assets/companions/low_energy_expression.png';
import sleepingExpression from '@/assets/companions/sleeping_expression.png';
import angryExpression from '@/assets/companions/angry_expression.png';

interface CreatureSpriteProps {
  emotion: string;             // determines the sprite to display
  size?: number;               // default 160px
  animate?: boolean;           // enables idle bounce animation
  className?: string;          // extra classes
  listening?: boolean;         // shows listening animation
  typing?: boolean;            // shows typing/thinking state
}

// Map filenames to imported assets
const assetMap: Record<string, string> = {
  'base_expression.png': baseExpression,
  'base_happy_expression.png': baseHappyExpression,
  'excited_expression.png': excitedExpression,
  'overjoyed_expression.png': overjoyedExpression,
  'happy_2_expression.png': happy2Expression,
  'happy_to_see_you_expression.png': happyToSeeYouExpression,
  'love_expression.png': loveExpression,
  'winking_expression.png': winkingExpression,
  'surprised_expression.png': surprisedExpression,
  'surprised_2_expression.png': surprised2Expression,
  'concerned_expression.png': concernedExpression,
  'why_expression.png': whyExpression,
  'low_energy_expression.png': lowEnergyExpression,
  'sleeping_expression.png': sleepingExpression,
  'angry_expression.png': angryExpression,
};

export const CreatureSprite = ({ 
  emotion, 
  size = 160, 
  animate = false, 
  className,
  listening = false,
  typing = false
}: CreatureSpriteProps) => {
  const [microEmotion, setMicroEmotion] = useState<string | null>(null);
  const { level } = useLevelSystem();
  
  // Calculate visual enhancements based on level
  const brightness = 1 + (level - 1) * 0.02; // 1.0 to 1.38 at level 20
  const glowIntensity = level >= 10 ? 0.3 + (level - 10) * 0.03 : 0;
  const hasParticles = level >= 10;

  // Idle cycle timer - random micro-expressions
  useEffect(() => {
    // Skip idle animations for strong emotions, when listening, or when typing
    if (listening || typing || ['angry', 'sleeping', 'sad'].includes(emotion)) {
      return;
    }

    const interval = setInterval(() => {
      const options = ['winking', 'laughing', 'welcoming', null];
      const pick = options[Math.floor(Math.random() * options.length)];
      setMicroEmotion(pick);
    }, 4000 + Math.random() * 4000); // 4-8 seconds

    return () => clearInterval(interval);
  }, [emotion, listening, typing]);

  // Auto-clear micro-expression after 1200ms
  useEffect(() => {
    if (!microEmotion) return;
    const timer = setTimeout(() => setMicroEmotion(null), 1200);
    return () => clearTimeout(timer);
  }, [microEmotion]);

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
  const filename = getExpressionAsset(finalEmotion);
  const imageSrc = assetMap[filename] || baseExpression;

  return (
    <div 
      className={cn(
        "flex items-center justify-center relative",
        animate && "animate-[float_3s_ease-in-out_infinite]",
        listening && "animate-[pulse_2s_ease-in-out_infinite] shadow-lg shadow-white/40",
        typing && "animate-[sway_1.5s_ease-in-out_infinite]",
        className
      )}
      style={{ width: size, height: size }}
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

      {/* Particle effects for level 10+ */}
      {hasParticles && (
        <AnimatePresence>
          {[...Array(3)].map((_, i) => (
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

      <AnimatePresence mode="wait">
        <motion.div
          key={filename}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full h-full flex items-center justify-center relative z-10"
        >
          <img
            src={imageSrc}
            alt={`Creature ${emotion} expression`}
            className="w-full h-full object-contain"
            style={{ 
              imageRendering: 'crisp-edges',
              filter: `brightness(${brightness})`
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
