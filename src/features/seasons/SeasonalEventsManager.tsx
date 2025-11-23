import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake, Sparkles, Sun } from 'lucide-react';
import { getCurrentSeason, type SeasonConfig } from './seasonConfig';
import { useProfile } from '@/hooks/useProfile';

interface SeasonalEventsManagerProps {
  children: React.ReactNode;
}

export const SeasonalEventsManager = ({ children }: SeasonalEventsManagerProps) => {
  const { profile } = useProfile();
  const season = getCurrentSeason();
  
  // Check if seasonal visuals are enabled (default true)
  const seasonalVisualsEnabled = profile?.ritual_preferences?.seasonal_visuals !== false;
  
  if (!season || !seasonalVisualsEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full">
      {children}
      
      {/* Seasonal overlays */}
      <AnimatePresence>
        {season && (
          <>
            {/* Ambient color overlay */}
            {season.effects.ambientColor && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                className="fixed inset-0 pointer-events-none z-[5]"
                style={{ backgroundColor: season.effects.ambientColor }}
              />
            )}
            
            {/* Particle effects */}
            {season.effects.particles && (
              <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
                {season.effects.particles === 'snow' && <SnowParticles />}
                {season.effects.particles === 'flowers' && <FlowerParticles />}
                {season.effects.particles === 'stars' && <StarfallParticles />}
                {season.effects.particles === 'heatshimmer' && <HeatShimmer />}
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Snow particles for Winter Festival
const SnowParticles = () => {
  return (
    <>
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={`snow-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: ['0vh', '105vh'],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0, 0.7, 0.7, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 8 + Math.random() * 7,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: 'linear',
          }}
        >
          <Snowflake className="w-3 h-3 text-white/60" />
        </motion.div>
      ))}
    </>
  );
};

// Flower petals for Spring Bloom
const FlowerParticles = () => {
  const colors = ['hsl(330, 70%, 80%)', 'hsl(340, 80%, 85%)', 'hsl(50, 90%, 80%)', 'hsl(150, 60%, 85%)'];
  
  return (
    <>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`flower-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
            width: `${4 + Math.random() * 4}px`,
            height: `${4 + Math.random() * 4}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: ['0vh', '105vh'],
            x: [0, (Math.random() - 0.5) * 150],
            opacity: [0, 0.8, 0.8, 0],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
          }}
          transition={{
            duration: 10 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
};

// Falling stars for Starfall Night
const StarfallParticles = () => {
  return (
    <>
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `-5%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            y: ['0vh', '105vh'],
            x: [(Math.random() - 0.5) * 200, (Math.random() - 0.5) * 300],
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: 'easeIn',
          }}
        >
          <Sparkles className="w-4 h-4 text-yellow-300" fill="currentColor" />
          {/* Star trail */}
          <motion.div
            className="absolute top-0 left-0 w-px h-12 bg-gradient-to-b from-yellow-300/80 to-transparent"
            style={{ transformOrigin: 'top' }}
            animate={{ scaleY: [0, 1, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: Math.random() * 8,
            }}
          />
        </motion.div>
      ))}
    </>
  );
};

// Heat shimmer for Summer Glow
const HeatShimmer = () => {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`heat-${i}`}
          className="absolute w-full h-32 opacity-30"
          style={{
            top: `${i * 15}%`,
            background: 'linear-gradient(90deg, transparent, hsl(45, 100%, 70%, 0.1), transparent)',
          }}
          animate={{
            x: ['-100%', '200%'],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 1.5,
          }}
        />
      ))}
      {/* Sun rays */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`ray-${i}`}
          className="absolute top-0 right-0 w-1 h-full origin-top-right opacity-10"
          style={{
            background: 'linear-gradient(to bottom, hsl(50, 100%, 60%), transparent)',
            transform: `rotate(${i * 30}deg)`,
          }}
          animate={{
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
    </>
  );
};
