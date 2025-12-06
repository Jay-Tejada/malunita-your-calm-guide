import { useOrbStore, OrbMood, OrbEnergy } from '@/state/orbState';
import { useOrbMicroVariation } from '@/hooks/useOrbMicroVariation';
import './orbAnimations.css';

const moodToClass: Record<string, string> = {
  idle: 'orb-idle',
  thinking: 'orb-thinking',
  celebrating: 'orb-celebrating',
  focused: 'orb-focused',
  morning: 'orb-morning',
  evening: 'orb-evening',
  evolving: 'orb-evolving',
};

const getAnimationClass = (mood: OrbMood, energy: OrbEnergy): string => {
  const base = moodToClass[mood] || 'orb-idle';
  
  // Apply energy-based speed variants for idle and focused states
  if (mood === 'idle' || mood === 'focused') {
    if (energy <= 2) return `${base}-low`;
    if (energy >= 4) return `${base}-high`;
  }
  
  return base;
};

const stageToStyle = (stage: number) => {
  // Subtle visual evolution per stage
  const baseSize = 120;
  const size = baseSize + (stage * 4); // Grows slightly
  const ringOpacity = Math.min(0.1 + (stage * 0.05), 0.4);
  const innerGlow = stage >= 3;
  const hasRing = stage >= 4;
  const hasParticles = stage >= 6;
  
  return { size, ringOpacity, innerGlow, hasRing, hasParticles };
};

export function LivingOrbV2() {
  const { mood, energy, stage, palette } = useOrbStore();
  const { scaleOffset, glowOffset } = useOrbMicroVariation();
  
  const animationClass = getAnimationClass(mood, energy);
  const { size, ringOpacity, innerGlow, hasRing } = stageToStyle(stage);
  
  const energyBrightness = 0.85 + (energy * 0.05); // 0.9 to 1.1
  
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring (appears at stage 4+) */}
      {hasRing && (
        <div 
          className="absolute rounded-full border"
          style={{
            width: size + 30,
            height: size + 30,
            borderColor: palette.accent,
            opacity: ringOpacity,
            transition: 'all 0.8s ease',
          }}
        />
      )}
      
      {/* Main orb */}
      <div
        className={`rounded-full ${animationClass}`}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 30% 30%, ${palette.base}, ${palette.accent})`,
          filter: `brightness(${energyBrightness + glowOffset})`,
          transform: `scale(${1 + scaleOffset})`,
          boxShadow: innerGlow 
            ? `inset 0 0 ${20 + stage * 5}px rgba(255,255,255,0.3), 0 0 ${15 + stage * 3}px ${palette.glow}`
            : `0 0 15px ${palette.glow}`,
          transition: 'all 0.8s ease',
        }}
      />
      
      {/* Stage indicator (subtle) */}
      <div 
        className="absolute bottom-0 text-xs opacity-30"
        style={{ color: palette.accent }}
      >
        {stage > 1 && `✦`.repeat(Math.min(stage - 1, 5))}
      </div>
    </div>
  );
}
