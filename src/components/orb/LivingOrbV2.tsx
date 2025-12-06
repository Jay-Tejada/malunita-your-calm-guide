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
  
  // Dark mode: layered moon-like orb with depth
  const darkModeStyle = {
    background: `
      radial-gradient(circle at 35% 25%, rgba(255,255,255,0.08) 0%, transparent 50%),
      radial-gradient(circle at 70% 80%, rgba(0,0,0,0.3) 0%, transparent 40%),
      radial-gradient(circle at 30% 30%, #6A6158, #3D3832)
    `,
    boxShadow: `
      0 0 60px rgba(160, 150, 135, 0.25),
      0 0 30px rgba(120, 110, 95, 0.15),
      inset 0 -20px 40px rgba(0,0,0,0.3),
      inset 0 10px 20px rgba(255,255,255,0.05)
    `,
  };
  
  // Light mode: original bright orb
  const lightModeStyle = {
    background: `radial-gradient(circle at 30% 30%, ${palette.base}, ${palette.accent})`,
    boxShadow: innerGlow 
      ? `inset 0 0 ${20 + stage * 5}px rgba(255,255,255,0.3), 0 0 ${15 + stage * 3}px ${palette.glow}`
      : `0 0 15px ${palette.glow}`,
  };
  
  // Softer brightness in dark mode
  const energyBrightness = isDark 
    ? 0.95 + (energy * 0.015) // 0.965 to 1.025 in dark (very subtle)
    : 0.85 + (energy * 0.05); // 0.9 to 1.1 in light
  
  const ringColor = isDark ? 'rgba(160, 150, 135, 0.3)' : palette.accent;
  const stageColor = isDark ? 'rgba(160, 150, 135, 0.5)' : palette.accent;
  
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
        className={`rounded-full ${animationClass} ${isDark ? 'orb-dark' : ''}`}
        style={{
          width: size,
          height: size,
          ...(isDark ? darkModeStyle : lightModeStyle),
          filter: `brightness(${energyBrightness + glowOffset})`,
          transform: `scale(${1 + scaleOffset})`,
          transition: 'all 0.8s ease',
          position: 'relative',
        }}
      >
        {/* Noise texture overlay for dark mode */}
        {isDark && (
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              opacity: 0.04,
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </div>
      
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
