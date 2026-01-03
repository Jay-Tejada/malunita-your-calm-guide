import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

type TimeOfDay = 'morning' | 'midday' | 'evening' | 'night';
type AIConfidence = 'low' | 'medium' | 'high';
type InteractionState = 'idle' | 'listening' | 'processing';

interface OrbProps {
  size?: number;
  onClick?: () => void;
  className?: string;
  forceTime?: TimeOfDay;
  aiConfidence?: AIConfidence;
  interactionState?: InteractionState;
  isPassive?: boolean;
  // Legacy props for backward compatibility
  isRecording?: boolean;
  isProcessing?: boolean;
  isFocused?: boolean;
}

/**
 * Malunita Orb - Confidence-driven intelligence indicator
 * 
 * Design philosophy:
 * - Deterministic behavior based on ai_confidence and interaction_state
 * - "This understands me and is ready when I am"
 * - No fast animations, no icons, no color cycling
 * - Subtle, organic motion that conveys understanding level
 */
const Orb = ({ 
  size = 200, 
  onClick, 
  className = '', 
  forceTime,
  aiConfidence = 'medium', // Default to medium if unavailable
  interactionState = 'idle',
  isPassive = false,
  // Legacy prop mapping
  isRecording = false,
  isProcessing = false,
  isFocused = false, // Kept for backward compatibility
}: OrbProps) => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('midday');
  const [breathPhase, setBreathPhase] = useState(0);

  // Map legacy props to new system
  const effectiveInteractionState: InteractionState = useMemo(() => {
    if (interactionState !== 'idle') return interactionState;
    if (isRecording) return 'listening';
    if (isProcessing) return 'processing';
    return 'idle';
  }, [interactionState, isRecording, isProcessing]);

  // Time of day detection (kept for color palette)
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

  // Deterministic breathing based on confidence level
  // Low: no motion | Medium: very slow | High: gentle, settled
  useEffect(() => {
    if (isPassive || aiConfidence === 'low') {
      setBreathPhase(0);
      return;
    }
    
    // Deterministic interval based on confidence
    const breathInterval = aiConfidence === 'high' ? 80 : 100;
    
    const interval = setInterval(() => {
      setBreathPhase(p => (p + 1) % 360);
    }, breathInterval);
    
    return () => clearInterval(interval);
  }, [isPassive, aiConfidence]);

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

  // Calculate breathing values (only active for medium/high confidence)
  const breathRad = (breathPhase * Math.PI) / 180;
  const primaryBreath = aiConfidence === 'low' ? 0 : Math.sin(breathRad * 0.5);
  
  // Confidence-driven behavior modifiers
  const confidenceModifiers = useMemo(() => {
    switch (aiConfidence) {
      case 'low':
        return {
          breathScale: 0,        // Still
          glowIntensity: 0.5,    // Minimal glow
          innerMotion: 0,        // No internal motion
          density: 1.15,         // Dense appearance (slightly smaller, more solid)
        };
      case 'medium':
        return {
          breathScale: 0.01,     // ±1% scale - very slow breathing
          glowIntensity: 0.75,   // Soft glow
          innerMotion: 0.3,      // Faint internal motion
          density: 1.0,
        };
      case 'high':
        return {
          breathScale: 0.015,    // Slightly more pronounced
          glowIntensity: 1.0,    // Subtle layered glow
          innerMotion: 0.7,      // Gentle internal rotation
          density: 0.95,         // "Settled and ready" - slightly expanded
        };
    }
  }, [aiConfidence]);

  // Interaction state modifiers (applied on top of confidence)
  const interactionModifiers = useMemo(() => {
    switch (effectiveInteractionState) {
      case 'listening':
        return {
          scaleBoost: 0.03,      // Slight expansion
          glowBoost: 0.3,        // Glow increases
          motionBoost: 0,
        };
      case 'processing':
        return {
          scaleBoost: 0,
          glowBoost: 0.1,
          motionBoost: 0.4,      // Internal motion increases slightly
        };
      default: // idle
        return {
          scaleBoost: 0,
          glowBoost: 0,
          motionBoost: 0,
        };
    }
  }, [effectiveInteractionState]);

  // Calculate final values
  const passiveMultiplier = isPassive ? 0.3 : 1;
  
  const finalBreathScale = confidenceModifiers.breathScale * primaryBreath * passiveMultiplier;
  const finalScale = confidenceModifiers.density + finalBreathScale + interactionModifiers.scaleBoost;
  
  const finalGlowIntensity = (confidenceModifiers.glowIntensity + interactionModifiers.glowBoost) * passiveMultiplier;
  const finalInnerMotion = (confidenceModifiers.innerMotion + interactionModifiers.motionBoost) * passiveMultiplier;

  // Dynamic glow size
  const baseGlowSize = size * 0.35;
  const dynamicGlowSize = baseGlowSize * finalGlowIntensity;

  // Inner movement for "intelligence" feel (only for medium/high confidence)
  const innerShift = aiConfidence === 'low' ? { x: 0, y: 0 } : {
    x: Math.sin(breathRad * 0.3) * 3 * finalInnerMotion,
    y: Math.cos(breathRad * 0.4) * 2 * finalInnerMotion,
  };

  // Gradient position shift for subtle internal motion
  const gradientCenter = {
    x: 35 + innerShift.x,
    y: 35 + innerShift.y,
  };

  return (
    <motion.div
      onClick={onClick}
      className={`relative cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      animate={{
        scale: finalScale,
      }}
      transition={{
        scale: { duration: 1.2, ease: 'easeInOut' },
      }}
      whileTap={onClick ? { scale: finalScale * 0.97 } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={
        effectiveInteractionState === 'listening' ? 'Listening...' : 
        effectiveInteractionState === 'processing' ? 'Processing...' : 
        'Malunita orb - tap to interact'
      }
    >
      {/* Outer ambient glow - soft halo (visibility based on confidence) */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.glow} 0%, transparent 70%)`,
        }}
        animate={{
          opacity: 0.3 + primaryBreath * 0.1 * finalGlowIntensity,
          scale: 1.15 + primaryBreath * 0.05,
        }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
      />

      {/* Secondary glow layer - depth (only for high confidence) */}
      {aiConfidence === 'high' && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -dynamicGlowSize * 0.3,
            background: `radial-gradient(circle at 50% 50%, ${colors.glow} 0%, transparent 60%)`,
            filter: 'blur(20px)',
          }}
          animate={{
            opacity: 0.2 + primaryBreath * 0.08,
          }}
          transition={{ duration: 1.2 }}
        />
      )}

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
            opacity: aiConfidence === 'low' ? 0.3 : 0.5 + primaryBreath * 0.2,
            x: innerShift.x * 0.5,
            y: innerShift.y * 0.5,
            scale: 1 + primaryBreath * 0.03 * finalInnerMotion,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
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

        {/* High confidence: gentle internal rotation (settled and ready) */}
        {aiConfidence === 'high' && (
          <motion.div
            className="absolute inset-[20%] rounded-full pointer-events-none"
            style={{
              background: `conic-gradient(
                from 0deg,
                transparent 0%,
                ${colors.inner} 20%,
                transparent 40%,
                ${colors.inner} 60%,
                transparent 80%
              )`,
              filter: 'blur(15px)',
              opacity: 0.15,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 20, // Very slow rotation
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Listening state: expanded luminance */}
        {effectiveInteractionState === 'listening' && (
          <motion.div
            className="absolute inset-[10%] rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${colors.inner} 0%, transparent 60%)`,
              filter: 'blur(15px)',
            }}
            animate={{
              opacity: [0.25, 0.4, 0.25],
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 3, // Slow, not fast
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Processing state: subtle internal motion increase */}
        {effectiveInteractionState === 'processing' && (
          <motion.div
            className="absolute inset-[15%] rounded-full pointer-events-none"
            style={{
              background: `conic-gradient(
                from 0deg,
                transparent 0%,
                ${colors.inner} 15%,
                transparent 30%,
                ${colors.inner} 45%,
                transparent 60%
              )`,
              filter: 'blur(12px)',
              opacity: 0.2,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 12, // Slow, no spinners
              repeat: Infinity,
              ease: 'linear',
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
      aiConfidence="medium"
      isPassive
      className={`orb-mini ${className}`}
    />
  );
};

export default Orb;
