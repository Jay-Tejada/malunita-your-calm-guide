import { Check, Sparkles } from "lucide-react";
import { PersonalityType } from "@/hooks/useCompanionIdentity";

interface OrbitalParticlesProps {
  active: boolean;
}

export const OrbitalParticles = ({ active }: OrbitalParticlesProps) => (
  <>
    {/* Orbit line 1 */}
    <div className={`absolute inset-0 ${active ? 'animate-squiggle' : ''}`}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <ellipse
          cx="50"
          cy="50"
          rx="40"
          ry="35"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-orb-orbit opacity-20"
          style={{ transform: 'rotate(15deg)', transformOrigin: 'center' }}
        />
      </svg>
    </div>
    
    {/* Orbit line 2 */}
    <div className={`absolute inset-0 ${active ? 'animate-squiggle' : ''}`} style={{ animationDelay: '0.15s' }}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <ellipse
          cx="50"
          cy="50"
          rx="38"
          ry="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-orb-orbit opacity-15"
          style={{ transform: 'rotate(-25deg)', transformOrigin: 'center' }}
        />
      </svg>
    </div>
    
    {/* Small orbiting particles */}
    {!active && (
      <>
        <div className="absolute top-1/4 left-1/4 w-1 h-1 rounded-full bg-orb-orbit opacity-30 animate-orbit" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-orb-orbit opacity-20 animate-orbit-reverse" />
      </>
    )}
  </>
);

interface OrbIndicatorProps {
  isListening: boolean;
  isResponding: boolean;
  isSaving: boolean;
  showSuccess: boolean;
  stopWordDetected: boolean;
  colors: { core: string; glow: string; halo: string };
}

export const OrbIndicator = ({
  isListening,
  isResponding,
  isSaving,
  showSuccess,
  stopWordDetected,
  colors,
}: OrbIndicatorProps) => {
  // Center indicator when listening
  if (isListening && !stopWordDetected) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full animate-listening-pulse" 
          style={{
            background: `radial-gradient(circle, hsl(${colors.glow} / 0.9), hsl(${colors.core} / 0.7))`,
            boxShadow: `0 0 12px hsl(${colors.glow} / 0.6), inset 0 0 6px hsl(${colors.glow} / 0.4)`
          }}
        />
      </div>
    );
  }

  // Stop word detected indicator
  if (stopWordDetected && isListening) {
    return (
      <div className="absolute inset-0 flex items-center justify-center animate-in scale-in duration-200">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-companion-breath">
            <Check className="w-6 h-6 text-primary" strokeWidth={3} />
          </div>
        </div>
      </div>
    );
  }

  // Success checkmark
  if (showSuccess && !isListening && !isResponding && !isSaving) {
    return (
      <div className="absolute inset-0 flex items-center justify-center animate-in scale-in duration-300">
        <div className="relative">
          <Check className="w-10 h-10 text-foreground" strokeWidth={3} />
        </div>
      </div>
    );
  }

  // Processing spinner when responding or saving
  if (isResponding || isSaving) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" 
          style={{
            borderColor: 'hsl(var(--orb-glow-thinking) / 0.3)',
            borderTopColor: 'hsl(var(--orb-core-thinking) / 0.8)',
          }}
        />
      </div>
    );
  }

  // Idle state - soft glow with subtle pulse
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-2.5 h-2.5 rounded-full animate-companion-breath" 
        style={{
          background: `radial-gradient(circle, hsl(var(--foreground) / 0.5), hsl(var(--foreground) / 0.3))`,
        }}
      />
    </div>
  );
};

interface TaskStreakSparklesProps {
  taskStreak: number;
}

export const TaskStreakSparkles = ({ taskStreak }: TaskStreakSparklesProps) => {
  if (taskStreak < 3) return null;
  
  return (
    <div className="absolute -inset-8 pointer-events-none">
      <Sparkles className="absolute top-0 left-0 w-4 h-4 text-primary animate-companion-sparkle" />
      <Sparkles className="absolute top-0 right-0 w-4 h-4 text-primary animate-companion-sparkle" style={{ animationDelay: '0.2s' }} />
      <Sparkles className="absolute bottom-0 left-1/2 w-4 h-4 text-primary animate-companion-sparkle" style={{ animationDelay: '0.4s' }} />
    </div>
  );
};

interface EvolutionRipplesProps {
  isEvolving: boolean;
}

export const EvolutionRipples = ({ isEvolving }: EvolutionRipplesProps) => {
  if (!isEvolving) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-[evolution-ripple_2s_ease-out]" />
      <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-[evolution-ripple_2s_ease-out_0.5s]" />
      <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[evolution-ripple_2s_ease-out_1s]" />
    </div>
  );
};

interface SuccessRippleProps {
  stopWordDetected: boolean;
}

export const SuccessRipple = ({ stopWordDetected }: SuccessRippleProps) => {
  if (!stopWordDetected) return null;
  
  return (
    <>
      <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-success animate-tap-ripple" />
      <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-success animate-tap-ripple" style={{ animationDelay: '0.15s' }} />
      <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-success/60 animate-tap-ripple" style={{ animationDelay: '0.3s' }} />
    </>
  );
};

export const getOrbColors = (personality: PersonalityType, selectedColorway?: string) => {
  // If a colorway is selected, use it
  if (selectedColorway && selectedColorway !== 'zen-default') {
    const colorwayKey = selectedColorway.replace(/-/g, '-');
    return {
      core: `var(--colorway-${colorwayKey}-core)`,
      glow: `var(--colorway-${colorwayKey}-glow)`,
      halo: `var(--colorway-${colorwayKey}-halo)`,
    };
  }
  
  // Fallback to personality colors
  switch (personality) {
    case 'zen':
      return {
        core: 'var(--orb-zen-core)',
        glow: 'var(--orb-zen-glow)',
        halo: 'var(--orb-zen-halo)',
      };
    case 'spark':
      return {
        core: 'var(--orb-spark-core)',
        glow: 'var(--orb-spark-glow)',
        halo: 'var(--orb-spark-halo)',
      };
    case 'cosmo':
      return {
        core: 'var(--orb-cosmo-core)',
        glow: 'var(--orb-cosmo-glow)',
        halo: 'var(--orb-cosmo-halo)',
      };
    default:
      return {
        core: 'var(--orb-core-idle)',
        glow: 'var(--orb-glow-idle)',
        halo: 'var(--orb-halo-idle)',
      };
  }
};
