import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
}

interface AmbientParticlesProps {
  isActive: boolean;
  orbSize: number;
  color?: string;
  isProcessing?: boolean; // Slower, more meditative particles during transcription
}

/**
 * Subtle ambient particle system for voice recording state
 * 
 * Design philosophy:
 * - Very small dots (2-4px), dust-like
 * - Opacity: 5-12%
 * - Slow irregular drift, randomized direction
 * - Float gently around the orb area
 * - Fade in/out smoothly with recording state
 */
export const AmbientParticles = ({ 
  isActive, 
  orbSize,
  color = 'hsl(35, 30%, 60%)',
  isProcessing = false,
}: AmbientParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Particle field radius (extends beyond orb)
  const fieldRadius = orbSize * 0.9;
  
  // Generate particles when active
  // Processing mode: fewer, slower particles for meditative feel
  const baseParticles = useMemo(() => {
    const count = isProcessing ? 12 : 18; // Fewer particles when processing
    return Array.from({ length: count }, (_, i) => {
      // Random angle for initial position
      const angle = Math.random() * Math.PI * 2;
      // Random distance from center (weighted toward edges)
      const distance = (0.3 + Math.random() * 0.7) * fieldRadius;
      
      // Processing mode: slower drift, lower opacity
      const driftMultiplier = isProcessing ? 0.6 : 1;
      const opacityBase = isProcessing ? 0.08 : 0.05;
      const opacityRange = isProcessing ? 0.08 : 0.07;
      const durationBase = isProcessing ? 12 : 8;
      const durationRange = isProcessing ? 8 : 6;
      
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 2 + Math.random() * 2, // 2-4px
        opacity: opacityBase + Math.random() * opacityRange,
        driftX: (Math.random() - 0.5) * 40 * driftMultiplier, // Slower when processing
        driftY: (Math.random() - 0.5) * 40 * driftMultiplier,
        duration: durationBase + Math.random() * durationRange, // Slower when processing
        delay: Math.random() * 2, // Staggered appearance
      };
    });
  }, [fieldRadius, isProcessing]);

  // Additional particles that appear when recording (not during processing)
  const boostParticles = useMemo(() => {
    if (isProcessing) return []; // No boost particles during processing - keep it calm
    
    const count = 6; // Extra particles during recording
    return Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = (0.4 + Math.random() * 0.6) * fieldRadius;
      
      return {
        id: 100 + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 2 + Math.random() * 1.5,
        opacity: 0.06 + Math.random() * 0.05,
        driftX: (Math.random() - 0.5) * 35,
        driftY: (Math.random() - 0.5) * 35,
        duration: 10 + Math.random() * 5,
        delay: 0.5 + Math.random() * 1.5,
      };
    });
  }, [fieldRadius, isProcessing]);

  // Combine particles when active
  useEffect(() => {
    if (isActive) {
      setParticles([...baseParticles, ...boostParticles]);
    } else {
      setParticles([]);
    }
  }, [isActive, baseParticles, boostParticles]);

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{
        width: orbSize,
        height: orbSize,
      }}
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: color,
              left: '50%',
              top: '50%',
              marginLeft: -particle.size / 2,
              marginTop: -particle.size / 2,
            }}
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              x: [particle.x, particle.x + particle.driftX, particle.x - particle.driftX * 0.5, particle.x],
              y: [particle.y, particle.y + particle.driftY, particle.y - particle.driftY * 0.5, particle.y],
              opacity: particle.opacity,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.3,
              transition: { duration: 1.2, ease: 'easeOut' }
            }}
            transition={{
              x: {
                duration: particle.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatType: 'reverse',
              },
              y: {
                duration: particle.duration * 1.1, // Slightly different timing for organic feel
                repeat: Infinity,
                ease: 'easeInOut',
                repeatType: 'reverse',
              },
              opacity: {
                duration: 0.8,
                delay: particle.delay,
                ease: 'easeOut',
              },
              scale: {
                duration: 0.6,
                delay: particle.delay,
                ease: 'easeOut',
              },
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
