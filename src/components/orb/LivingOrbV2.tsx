import { useOrbStore, OrbMood, OrbEnergy } from '@/state/orbState';
import { useOrbMicroVariation } from '@/hooks/useOrbMicroVariation';
import { useThemeStore } from '@/state/themeState';
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
  const resolved = useThemeStore((state) => state.resolved);
  
  const animationClass = getAnimationClass(mood, energy);
  const { size, ringOpacity, innerGlow, hasRing } = stageToStyle(stage);
  
  const isDark = resolved === 'dark';
  
  // Dark mode: softer moon-like orb
  // Light mode: original bright orb
  const orbGradient = isDark
    ? 'radial-gradient(circle at 30% 30%, hsl(30 10% 32%), hsl(30 8% 22%))'
    : `radial-gradient(circle at 30% 30%, ${palette.base}, ${palette.accent})`;
  
  const orbGlow = isDark
    ? innerGlow
      ? `inset 0 0 ${15 + stage * 3}px rgba(255, 255, 255, 0.05), 0 0 ${30 + stage * 5}px rgba(180, 170, 155, 0.3)`
      : `0 0 40px rgba(180, 170, 155, 0.25)`
    : innerGlow 
      ? `inset 0 0 ${20 + stage * 5}px rgba(255,255,255,0.3), 0 0 ${15 + stage * 3}px ${palette.glow}`
      : `0 0 15px ${palette.glow}`;
  
  // Softer brightness in dark mode
  const energyBrightness = isDark 
    ? 0.9 + (energy * 0.02) // 0.92 to 1.0 in dark
    : 0.85 + (energy * 0.05); // 0.9 to 1.1 in light
  
  const ringColor = isDark ? 'rgba(180, 170, 155, 0.4)' : palette.accent;
  const stageColor = isDark ? 'rgba(180, 170, 155, 0.5)' : palette.accent;
  
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring (appears at stage 4+) */}
      {hasRing && (
        <div 
          className="absolute rounded-full border"
          style={{
            width: size + 30,
            height: size + 30,
            borderColor: ringColor,
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
          background: orbGradient,
          filter: `brightness(${energyBrightness + glowOffset})`,
          transform: `scale(${1 + scaleOffset})`,
          boxShadow: orbGlow,
          transition: 'all 0.8s ease',
        }}
      />
      
      {/* Stage indicator (subtle) */}
      <div 
        className="absolute bottom-0 text-xs opacity-30"
        style={{ color: stageColor }}
      >
        {stage > 1 && `✦`.repeat(Math.min(stage - 1, 5))}
      </div>
    </div>
  );
}
