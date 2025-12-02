import { useState, useEffect } from 'react';

type TimeOfDay = 'morning' | 'midday' | 'evening' | 'night';

interface OrbProps {
  size?: number;
  onClick?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
}

const Orb = ({ size = 200, onClick, isRecording = false, isProcessing = false }: OrbProps) => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setTimeOfDay('morning');
      else if (hour >= 11 && hour < 16) setTimeOfDay('midday');
      else if (hour >= 16 && hour < 20) setTimeOfDay('evening');
      else setTimeOfDay('night');
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000);
    return () => clearInterval(interval);
  }, []);

  const palettes = {
    morning: {
      primary: '#E8D5C4',
      secondary: '#F5EDE4',
      shadow: 'rgba(180, 150, 130, 0.3)',
      glow: 'rgba(232, 213, 196, 0.2)',
    },
    midday: {
      primary: '#F0E8DC',
      secondary: '#FAF6F0',
      shadow: 'rgba(160, 150, 140, 0.25)',
      glow: 'rgba(240, 232, 220, 0.2)',
    },
    evening: {
      primary: '#E5D4C0',
      secondary: '#EDE4D8',
      shadow: 'rgba(170, 140, 110, 0.35)',
      glow: 'rgba(229, 212, 192, 0.25)',
    },
    night: {
      primary: '#C8D0D8',
      secondary: '#D8DFE5',
      shadow: 'rgba(100, 110, 130, 0.3)',
      glow: 'rgba(200, 208, 216, 0.15)',
    },
  };

  const colors = palettes[timeOfDay];

  // Recording state uses a soft coral
  const activeColors = isRecording ? {
    primary: '#E8B4A4',
    secondary: '#F5DDD4',
    shadow: 'rgba(200, 130, 110, 0.4)',
    glow: 'rgba(232, 180, 164, 0.3)',
  } : isProcessing ? {
    primary: '#D4D8E8',
    secondary: '#E4E8F5',
    shadow: 'rgba(130, 140, 180, 0.3)',
    glow: 'rgba(212, 216, 232, 0.25)',
  } : colors;

  return (
    <button
      onClick={onClick}
      className="relative focus:outline-none group"
      style={{ width: size, height: size }}
      aria-label={isRecording ? "Recording..." : isProcessing ? "Processing..." : "Tap to capture"}
    >
      {/* Soft glow behind orb */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-50 transition-all duration-[3000ms]"
        style={{
          background: `radial-gradient(circle, ${activeColors.glow} 0%, transparent 70%)`,
          transform: 'scale(1.3)',
        }}
      />

      {/* Main orb */}
      <div
        className={`
          relative w-full h-full rounded-full 
          transition-all duration-[3000ms] ease-in-out
          ${isRecording ? 'animate-breathe-fast' : 'animate-breathe'}
        `}
        style={{
          background: `
            radial-gradient(
              circle at 35% 30%,
              ${activeColors.secondary} 0%,
              ${activeColors.primary} 50%,
              ${activeColors.primary} 100%
            )
          `,
          boxShadow: `
            0 ${size * 0.15}px ${size * 0.25}px ${activeColors.shadow},
            inset 0 -${size * 0.05}px ${size * 0.1}px rgba(0,0,0,0.05),
            inset 0 ${size * 0.05}px ${size * 0.1}px rgba(255,255,255,0.3)
          `,
        }}
      />

      {/* Subtle highlight reflection */}
      <div
        className="absolute rounded-full opacity-40 transition-all duration-[3000ms]"
        style={{
          width: size * 0.3,
          height: size * 0.15,
          top: size * 0.15,
          left: size * 0.25,
          background: `radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)`,
          filter: 'blur(4px)',
        }}
      />

      {/* Recording indicator dot */}
      {isRecording && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-400/80 animate-pulse"
        />
      )}

      {/* Processing spinner */}
      {isProcessing && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-2 border-foreground/20 border-t-foreground/60 rounded-full animate-spin"
        />
      )}
    </button>
  );
};

export default Orb;
