import { useEffect, useState } from 'react';
import { PersonalityType } from '@/hooks/useCompanionIdentity';
import { EmotionState } from '@/hooks/useCompanionEmotion';
import { CompanionStage } from '@/hooks/useCompanionGrowth';

interface CompanionHabitatProps {
  personality: PersonalityType;
  emotion: EmotionState;
  stage: CompanionStage;
}

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Time-based gradient bases (using semantic tokens)
const timeGradients: Record<TimeOfDay, string> = {
  morning: 'from-[hsl(25_35_88%)] via-[hsl(36_67_98%)] to-[hsl(36_40_96%)]', // warm peach/beige
  afternoon: 'from-[hsl(0_0_100%)] via-[hsl(36_40_96%)] to-[hsl(36_30_95%)]', // neutral beige/white
  evening: 'from-[hsl(300_25_88%)] via-[hsl(320_30_93%)] to-[hsl(36_40_96%)]', // soft indigo/rose
  night: 'from-[hsl(225_20_25%)] via-[hsl(225_15_35%)] to-[hsl(220_15_50%)]', // dim cosmic navy
};

// Personality color overlays (very subtle)
const personalityOverlays: Record<PersonalityType, string> = {
  zen: 'bg-blue-500/[0.02]', // barely visible blue tint
  spark: 'bg-amber-500/[0.03]', // barely visible gold tint
  cosmo: 'bg-purple-500/[0.02]', // barely visible purple tint
};

export const CompanionHabitat = ({ personality, emotion, stage }: CompanionHabitatProps) => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Emotion affects subtle opacity shifts
  const emotionOpacity = 
    emotion === 'excited' ? 0.95 :
    emotion === 'calm' ? 0.7 :
    emotion === 'sleepy' ? 0.5 :
    emotion === 'proud' ? 0.9 :
    0.8;

  // Stage-based particle count
  const particleCount = 
    stage === 0 ? 0 :
    stage === 1 ? 3 :
    stage === 2 ? 6 :
    stage === 3 ? 10 :
    15; // stage 4

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - time of day */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${timeGradients[timeOfDay]} transition-all duration-[3000ms] ease-in-out`}
        style={{ opacity: emotionOpacity }}
      />

      {/* Personality overlay */}
      <div 
        className={`absolute inset-0 ${personalityOverlays[personality]} transition-opacity duration-2000`}
      />

      {/* Stage 2+: Drifting glow waves */}
      {stage >= 2 && (
        <>
          <div className="absolute inset-0 opacity-20">
            <div 
              className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2 bg-gradient-radial from-primary/10 via-transparent to-transparent animate-[drift-wave_20s_ease-in-out_infinite]"
              style={{ animationDelay: '0s' }}
            />
            <div 
              className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2 bg-gradient-radial from-primary/5 via-transparent to-transparent animate-[drift-wave_25s_ease-in-out_infinite]"
              style={{ animationDelay: '5s' }}
            />
          </div>
        </>
      )}

      {/* Stage 3+: Soft light trails */}
      {stage >= 3 && (
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-primary/20 to-transparent blur-3xl animate-[light-trail_30s_ease-in-out_infinite]"
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-secondary/15 to-transparent blur-3xl animate-[light-trail_35s_ease-in-out_infinite_reverse]"
          />
        </div>
      )}

      {/* Stage 4: Cosmic shimmer */}
      {stage === 4 && (
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary))_0%,transparent_50%)] animate-[cosmic-shimmer_40s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Floating dust motes / particles */}
      {particleCount > 0 && (
        <div className="absolute inset-0">
          {Array.from({ length: particleCount }).map((_, i) => {
            const size = Math.random() * 2 + 1; // 1-3px
            const left = Math.random() * 100;
            const animationDuration = 15 + Math.random() * 20; // 15-35s
            const animationDelay = Math.random() * 10; // 0-10s
            const particleOpacity = 0.1 + Math.random() * 0.15; // 0.1-0.25

            return (
              <div
                key={i}
                className="absolute rounded-full bg-foreground animate-[float-particle_var(--duration)_ease-in-out_infinite]"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  top: '100%',
                  opacity: particleOpacity,
                  '--duration': `${animationDuration}s`,
                  animationDelay: `${animationDelay}s`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
