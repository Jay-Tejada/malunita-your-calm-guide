import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

type TimeOfDay = 'morning' | 'midday' | 'evening' | 'night';
type OrbState = 'idle' | 'listening' | 'processing' | 'settling';

interface OrbProps {
  size?: number;
  onClick?: () => void;
  className?: string;
  forceTime?: TimeOfDay;
  isRecording?: boolean;
  isProcessing?: boolean;
  isFocused?: boolean;
  isPassive?: boolean;
}

/**
 * Malunita Orb - Alive, intelligent, state-aware
 * 
 * Design philosophy:
 * - Never static - always subtle organic motion
 * - No hard edges, no flat fills
 * - Slow, organic, irregular animations
 * - Presence, not decoration
 */
const Orb = ({ 
  size = 200, 
  onClick, 
  className = '', 
  forceTime,
  isRecording = false, 
  isProcessing = false,
  isFocused = false,
  isPassive = false,
}: OrbProps) => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('midday');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [breathPhase, setBreathPhase] = useState(0);
  const [wanderOffset, setWanderOffset] = useState({ x: 0, y: 0 });
  const prevStateRef = useRef<OrbState>('idle');
  const breathIntervalRef = useRef<number>();
  const wanderIntervalRef = useRef<number>();

  // Determine current state
  useEffect(() => {
    const prevState = prevStateRef.current;
    let newState: OrbState = 'idle';
    
    if (isRecording) {
      newState = 'listening';
    } else if (isProcessing) {
      newState = 'processing';
    } else if (prevState === 'listening' || prevState === 'processing') {
      // Settling back from active state
      newState = 'settling';
      const timer = setTimeout(() => setOrbState('idle'), 800);
      return () => clearTimeout(timer);
    }
    
    prevStateRef.current = newState;
    setOrbState(newState);
  }, [isRecording, isProcessing]);

  // Time of day detection
  useEffect(() => {
    if (forceTime) {
      setTimeOfDay(forceTime);
      return;
    }

    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 10) setTimeOfDay('morning');
      else if (hour >= 10 && hour < 17) setTimeOfDay('midday');
      else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
      else setTimeOfDay('night');
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000);
    return () => clearInterval(interval);
  }, [forceTime]);

  // Organic breathing - irregular timing for life-like feel
  useEffect(() => {
    if (isPassive) return;
    
    const breathe = () => {
      setBreathPhase(p => (p + 1) % 360);
      // Vary next breath timing slightly for organic feel
      const nextInterval = 50 + Math.random() * 20;
      breathIntervalRef.current = window.setTimeout(breathe, nextInterval);
    };
    
    breathe();
    return () => {
      if (breathIntervalRef.current) clearTimeout(breathIntervalRef.current);
    };
  }, [isPassive]);

  // Subtle wandering motion - slow, irregular drift
  useEffect(() => {
    if (isPassive) {
      setWanderOffset({ x: 0, y: 0 });
      return;
    }
    
    const wander = () => {
      setWanderOffset({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      });
      // Very slow wander updates
      const nextWander = 3000 + Math.random() * 2000;
      wanderIntervalRef.current = window.setTimeout(wander, nextWander);
    };
    
    wander();
    return () => {
      if (wanderIntervalRef.current) clearTimeout(wanderIntervalRef.current);
    };
  }, [isPassive]);

  // Color palettes - warm, organic tones
  const palettes = useMemo(() => ({
    morning: {
      core: 'hsl(35, 45%, 92%)',
      mid: 'hsl(32, 35%, 85%)',
      edge: 'hsl(28, 25%, 75%)',
      glow: 'hsla(35, 50%, 88%, 0.5)',
      inner: 'hsla(40, 60%, 96%, 0.8)',
    },
    midday: {
      core: 'hsl(38, 30%, 95%)',
      mid: 'hsl(35, 22%, 88%)',
      edge: 'hsl(30, 15%, 78%)',
      glow: 'hsla(38, 35%, 90%, 0.4)',
      inner: 'hsla(42, 40%, 98%, 0.7)',
    },
    evening: {
      core: 'hsl(28, 35%, 90%)',
      mid: 'hsl(25, 28%, 82%)',
      edge: 'hsl(20, 20%, 70%)',
      glow: 'hsla(28, 40%, 85%, 0.45)',
      inner: 'hsla(32, 50%, 94%, 0.75)',
    },
    night: {
      core: 'hsl(220, 15%, 88%)',
      mid: 'hsl(215, 12%, 78%)',
      edge: 'hsl(210, 10%, 65%)',
      glow: 'hsla(220, 20%, 82%, 0.35)',
      inner: 'hsla(225, 25%, 92%, 0.6)',
    },
  }), []);

  const colors = palettes[timeOfDay];

  // Calculate organic breathing values
  const breathRad = (breathPhase * Math.PI) / 180;
  const primaryBreath = Math.sin(breathRad * 0.7); // Slow primary cycle
  const secondaryBreath = Math.sin(breathRad * 1.3 + 0.5) * 0.3; // Faster secondary
  const combinedBreath = (primaryBreath + secondaryBreath) / 1.3;

  // State-specific modifiers
  const stateModifiers = useMemo(() => {
    switch (orbState) {
      case 'listening':
        return {
          scale: 1.04 + combinedBreath * 0.02,
          glowIntensity: 1.4,
          glowSpread: 1.3,
          innerMotion: 1.5,
        };
      case 'processing':
        return {
          scale: 1.0 + combinedBreath * 0.015,
          glowIntensity: 1.1,
          glowSpread: 1.1,
          innerMotion: 2.0, // More internal activity
        };
      case 'settling':
        return {
          scale: 1.02 + combinedBreath * 0.01,
          glowIntensity: 1.2,
          glowSpread: 1.0,
          innerMotion: 0.8,
        };
      default: // idle
        return {
          scale: 1.0 + combinedBreath * 0.018,
          glowIntensity: 1.0,
          glowSpread: 1.0,
          innerMotion: 1.0,
        };
    }
  }, [orbState, combinedBreath]);

  // Passive state dampening
  const passiveMultiplier = isPassive ? 0.3 : 1;
  const finalScale = 1 + (stateModifiers.scale - 1) * passiveMultiplier;
  const finalGlowIntensity = stateModifiers.glowIntensity * passiveMultiplier + (1 - passiveMultiplier);

  // Dynamic glow size
  const baseGlowSize = size * 0.35;
  const dynamicGlowSize = baseGlowSize * stateModifiers.glowSpread * (0.9 + combinedBreath * 0.15);

  // Inner movement for "intelligence" feel
  const innerShift = {
    x: Math.sin(breathRad * 0.5) * 3 * stateModifiers.innerMotion,
    y: Math.cos(breathRad * 0.7) * 2 * stateModifiers.innerMotion,
  };

  // Gradient position shift for subtle internal motion
  const gradientCenter = {
    x: 35 + innerShift.x + wanderOffset.x,
    y: 35 + innerShift.y + wanderOffset.y,
  };

  return (
    <motion.div
      onClick={onClick}
      className={`relative cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      animate={{
        scale: finalScale,
        x: wanderOffset.x * (isPassive ? 0 : 1),
        y: wanderOffset.y * (isPassive ? 0 : 1),
      }}
      transition={{
        scale: { duration: 0.8, ease: 'easeInOut' },
        x: { duration: 4, ease: 'easeInOut' },
        y: { duration: 4, ease: 'easeInOut' },
      }}
      whileTap={{ scale: finalScale * 0.97 }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={
        isRecording ? 'Listening...' : 
        isProcessing ? 'Processing...' : 
        'Malunita orb - tap to interact'
      }
    >
      {/* Outer ambient glow - soft halo */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.glow} 0%, transparent 70%)`,
        }}
        animate={{
          opacity: 0.4 + combinedBreath * 0.15 * finalGlowIntensity,
          scale: 1.2 + combinedBreath * 0.08,
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Secondary glow layer - depth */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -dynamicGlowSize * 0.3,
          background: `radial-gradient(circle at 50% 50%, ${colors.glow} 0%, transparent 60%)`,
          filter: 'blur(20px)',
        }}
        animate={{
          opacity: 0.25 * finalGlowIntensity + combinedBreath * 0.1,
        }}
        transition={{ duration: 0.8 }}
      />

      {/* Main orb body */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: `
            radial-gradient(
              circle at ${gradientCenter.x}% ${gradientCenter.y}%,
              ${colors.core} 0%,
              ${colors.mid} 45%,
              ${colors.edge} 100%
            )
          `,
          boxShadow: `
            inset ${-size * 0.08}px ${-size * 0.08}px ${size * 0.15}px rgba(0, 0, 0, 0.06),
            inset ${size * 0.04}px ${size * 0.04}px ${size * 0.12}px rgba(255, 255, 255, 0.4),
            0 ${size * 0.06}px ${size * 0.18}px rgba(0, 0, 0, 0.08),
            0 0 ${dynamicGlowSize}px ${colors.glow}
          `,
          opacity: isPassive ? 0.85 : 1,
          filter: isPassive ? 'brightness(0.92)' : 'none',
          transition: 'opacity 0.4s ease, filter 0.4s ease',
        }}
      >
        {/* Inner luminance - the "intelligence" center */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '45%',
            height: '40%',
            left: '22%',
            top: '18%',
            background: `radial-gradient(
              ellipse at 50% 50%,
              ${colors.inner} 0%,
              transparent 70%
            )`,
            filter: 'blur(8px)',
          }}
          animate={{
            opacity: 0.6 + combinedBreath * 0.25,
            x: innerShift.x * 0.5,
            y: innerShift.y * 0.5,
            scale: 1 + combinedBreath * 0.05,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />

        {/* Subtle surface texture - very fine grain */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: 0.015,
            mixBlendMode: 'overlay',
          }}
        />

        {/* Processing state: slow internal current */}
        {orbState === 'processing' && (
          <motion.div
            className="absolute inset-[15%] rounded-full pointer-events-none"
            style={{
              background: `conic-gradient(
                from 0deg,
                transparent 0%,
                ${colors.inner} 15%,
                transparent 30%,
                ${colors.inner} 45%,
                transparent 60%,
                ${colors.inner} 75%,
                transparent 90%
              )`,
              filter: 'blur(12px)',
              opacity: 0.3,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Listening state: expanded luminance */}
        {orbState === 'listening' && (
          <motion.div
            className="absolute inset-[10%] rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${colors.inner} 0%, transparent 60%)`,
              filter: 'blur(15px)',
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>

      {/* Subtle rim highlight - adds 3D depth */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.08) 0%,
              transparent 40%,
              transparent 60%,
              rgba(0, 0, 0, 0.03) 100%
            )
          `,
        }}
      />
    </motion.div>
  );
};

// Mini variant for navigation/headers
export const OrbMini = ({ 
  size = 32, 
  timeOfDay,
  className = '' 
}: { 
  size?: number; 
  timeOfDay?: TimeOfDay;
  className?: string;
}) => {
  return (
    <Orb 
      size={size} 
      forceTime={timeOfDay}
      className={`orb-mini ${className}`}
    />
  );
};

export default Orb;
