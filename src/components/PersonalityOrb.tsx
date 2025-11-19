import { PersonalityType } from '@/hooks/useCompanionIdentity';

interface PersonalityOrbProps {
  personality: PersonalityType;
  isListening?: boolean;
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PersonalityOrb = ({ 
  personality, 
  isListening = false, 
  isThinking = false,
  size = 'md',
  className = ''
}: PersonalityOrbProps) => {
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  const getPersonalityColors = () => {
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

  const colors = getPersonalityColors();

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Layer 3: Outer Halo */}
      <div 
        className={`absolute inset-0 rounded-full blur-2xl ${
          isListening ? 'animate-listening-pulse' : 
          isThinking ? 'animate-thinking-shimmer' : 
          'animate-companion-breath'
        }`}
        style={{
          background: `radial-gradient(circle, hsl(${colors.halo} / 0.4) 0%, hsl(${colors.halo} / 0.1) 50%, transparent 70%)`,
          filter: 'blur(24px)',
          transform: 'scale(1.5)',
        }}
      />
      
      {/* Layer 2: Middle Glow Ring */}
      <div 
        className={`absolute inset-0 rounded-full ${
          isListening ? 'animate-listening-pulse' : 
          isThinking ? 'animate-thinking-shimmer' : ''
        }`}
        style={{
          background: `radial-gradient(circle, hsl(${colors.glow} / 0.6) 0%, hsl(${colors.glow} / 0.3) 60%, transparent 100%)`,
          filter: 'blur(12px)',
          transform: 'scale(1.2)',
        }}
      />
      
      {/* Layer 1: Inner Core */}
      <div 
        className={`absolute inset-0 rounded-full ${
          isListening ? 'scale-105' : 
          isThinking ? 'animate-speaking-vibrate' : 
          'animate-companion-breath'
        }`}
        style={{
          background: `linear-gradient(135deg, hsl(${colors.core} / 0.95), hsl(${colors.glow} / 0.85))`,
          boxShadow: `0 6px 20px hsl(${colors.glow} / 0.3), inset 0 1px 0 hsl(${colors.core} / 0.6), inset 0 -1px 0 hsl(${colors.glow} / 0.4)`,
          border: '1px solid',
          borderColor: `hsl(${colors.glow} / 0.3)`,
        }}
      >
        {/* Center indicator */}
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-3 h-3 rounded-full animate-listening-pulse" 
              style={{
                background: `radial-gradient(circle, hsl(${colors.glow} / 0.9), hsl(${colors.core} / 0.7))`,
                boxShadow: `0 0 12px hsl(${colors.glow} / 0.6)`,
              }}
            />
          </div>
        )}
        
        {/* Idle indicator */}
        {!isListening && !isThinking && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-2.5 h-2.5 rounded-full animate-companion-breath" 
              style={{
                background: `radial-gradient(circle, hsl(var(--foreground) / 0.5), hsl(var(--foreground) / 0.3))`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
