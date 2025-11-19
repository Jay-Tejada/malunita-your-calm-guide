import { Colorway, Aura } from '@/hooks/useCompanionCosmetics';

interface CompanionPreviewProps {
  colorway: Colorway;
  aura: Aura;
  stage: number;
}

const COLORWAY_COLORS: Record<Colorway, { core: string; glow: string; halo: string }> = {
  'zen-default': { 
    core: 'hsl(200, 60%, 75%)', 
    glow: 'hsl(200, 65%, 65%)',
    halo: 'hsl(200, 70%, 60%)',
  },
  'dawn-peach': { 
    core: 'hsl(20, 85%, 75%)', 
    glow: 'hsl(25, 90%, 70%)',
    halo: 'hsl(30, 85%, 65%)',
  },
  'galaxy-indigo': { 
    core: 'hsl(240, 70%, 65%)', 
    glow: 'hsl(245, 75%, 60%)',
    halo: 'hsl(250, 80%, 55%)',
  },
  'solar-gold': { 
    core: 'hsl(45, 100%, 70%)', 
    glow: 'hsl(50, 100%, 65%)',
    halo: 'hsl(55, 100%, 60%)',
  },
  'mist-blue': { 
    core: 'hsl(200, 60%, 65%)', 
    glow: 'hsl(205, 65%, 60%)',
    halo: 'hsl(210, 70%, 55%)',
  },
  'onyx-shadow': { 
    core: 'hsl(270, 20%, 35%)', 
    glow: 'hsl(270, 25%, 45%)',
    halo: 'hsl(270, 30%, 50%)',
  },
};

export const CompanionPreview = ({ colorway, aura, stage }: CompanionPreviewProps) => {
  const colors = COLORWAY_COLORS[colorway];
  
  // Aura-based glow animation
  const getAuraAnimation = () => {
    switch (aura) {
      case 'pulse-ring':
        return 'animate-[pulse_2s_ease-in-out_infinite]';
      case 'dreamwave':
        return 'animate-[spin_8s_linear_infinite]';
      case 'starlight-halo':
        return 'animate-[pulse_3s_ease-in-out_infinite]';
      default:
        return '';
    }
  };

  // Scale based on stage
  const stageScale = stage === 0 ? 0.7 : stage === 1 ? 0.85 : stage === 2 ? 1.0 : stage === 3 ? 1.15 : 1.3;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Outer Halo */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl opacity-30 ${getAuraAnimation()}`}
        style={{
          background: `radial-gradient(circle, ${colors.halo}, transparent)`,
          transform: `scale(${stageScale * 1.5})`,
        }}
      />

      {/* Middle Glow */}
      <div
        className="absolute inset-2 rounded-full blur-xl opacity-60"
        style={{
          background: `radial-gradient(circle, ${colors.glow}, transparent)`,
          transform: `scale(${stageScale * 1.2})`,
        }}
      />

      {/* Core Orb */}
      <div
        className="absolute inset-4 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.core}, ${colors.glow})`,
          boxShadow: `0 0 40px ${colors.glow}80`,
          transform: `scale(${stageScale})`,
        }}
      />
      
      {/* Stage indicator */}
      <div className="absolute -bottom-2 text-xs text-muted-foreground">
        Stage {stage}
      </div>
    </div>
  );
};
