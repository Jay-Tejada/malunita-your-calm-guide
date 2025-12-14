import { useState, useEffect } from 'react';
import './orb/orbAnimations.css';

type TimeOfDay = 'morning' | 'midday' | 'evening' | 'night';
type OrbMood = 'neutral' | 'thinking' | 'celebrating' | 'supportive';

interface OrbProps {
  size?: number;
  onClick?: () => void;
  className?: string;
  forceTime?: TimeOfDay;
  isRecording?: boolean;
  isProcessing?: boolean;
  isFocused?: boolean;
  mood?: OrbMood;
}

const Orb = ({ 
  size = 200, 
  onClick, 
  className = '', 
  forceTime,
  isRecording = false, 
  isProcessing = false,
  isFocused = false,
  mood = 'neutral'
}: OrbProps) => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('midday');
  const [isPressed, setIsPressed] = useState(false);
  const [ripple, setRipple] = useState(false);

  // Determine time of day
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

  // Color palettes for each time of day
  const palettes = {
    morning: {
      primary: '#F5E6D3',
      secondary: '#EDD9C4',
      shadow: '#D4C4B0',
      glow: 'rgba(245, 230, 211, 0.4)',
    },
    midday: {
      primary: '#FAF6F1',
      secondary: '#F0EBE3',
      shadow: '#D8D3CA',
      glow: 'rgba(250, 246, 241, 0.3)',
    },
    evening: {
      primary: '#EFE4D4',
      secondary: '#E5D9C7',
      shadow: '#C9BBA8',
      glow: 'rgba(239, 228, 212, 0.4)',
    },
    night: {
      primary: '#E0E4E8',
      secondary: '#C8CED6',
      shadow: '#9CA5B0',
      glow: 'rgba(200, 206, 214, 0.3)',
    },
  };

  // Keep base colors - no color override for recording/processing states
  const colors = palettes[timeOfDay];

  const handleClick = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
    onClick?.();
  };

  // Get mood-specific animation class
  const getMoodClass = () => {
    switch (mood) {
      case 'thinking': return 'orb-thinking';
      case 'celebrating': return 'orb-celebrating';
      case 'supportive': return 'orb-supportive';
      default: return '';
    }
  };

  const getStateClass = () => {
    const classes: string[] = [];
    if (isFocused) classes.push('orb-focused');
    else if (isRecording) classes.push('orb-recording');
    else if (isProcessing) classes.push('orb-loading');
    else classes.push('orb-idle'); // Add idle class for subtle pulse animation
    return classes.join(' ');
  };

  const orbStyle: React.CSSProperties & { '--orbGlowColor'?: string } = {
    width: size,
    height: size,
    borderRadius: '50%',
    position: 'relative',
    cursor: onClick ? 'pointer' : 'default',
    transition: isFocused ? 'none' : 'all 0.3s ease-out',
    transform: isPressed ? 'scale(0.97)' : undefined, // Let CSS handle focused transform
    '--orbGlowColor': colors.glow,
    background: `
      radial-gradient(
        circle at 35% 35%,
        ${colors.primary} 0%,
        ${colors.secondary} 50%,
        ${colors.shadow} 100%
      )
    `,
    boxShadow: isFocused 
      ? `
        inset -${size * 0.1}px -${size * 0.1}px ${size * 0.2}px rgba(0, 0, 0, 0.08),
        inset ${size * 0.05}px ${size * 0.05}px ${size * 0.15}px rgba(255, 255, 255, 0.5),
        0 ${size * 0.1}px ${size * 0.25}px rgba(0, 0, 0, 0.1),
        0 0 60px rgba(255,245,230,0.4)
      `
      : `
        inset -${size * 0.1}px -${size * 0.1}px ${size * 0.2}px rgba(0, 0, 0, 0.08),
        inset ${size * 0.05}px ${size * 0.05}px ${size * 0.15}px rgba(255, 255, 255, 0.5),
        0 ${size * 0.1}px ${size * 0.25}px rgba(0, 0, 0, 0.1),
        0 0 ${size * 0.4}px ${colors.glow}
      `,
  };

  return (
    <div 
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`orb ${getMoodClass()} ${getStateClass()} ${className}`}
      style={orbStyle}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={isRecording ? "Recording..." : isProcessing ? "Processing..." : "Malunita orb - tap to capture"}
    >
      {/* Inner highlight for 3D effect */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '30%',
          height: '25%',
          borderRadius: '50%',
          background: `radial-gradient(
            circle,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(255, 255, 255, 0) 70%
          )`,
          filter: 'blur(8px)',
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
        }}
      />


      {/* Loading: Circular progress stroke */}
      {isProcessing && (
        <>
          <svg 
            className="orb-progress-ring"
            style={{
              position: 'absolute',
              inset: -4,
              width: 'calc(100% + 8px)',
              height: 'calc(100% + 8px)',
            }}
          >
            <circle
              cx="50%"
              cy="50%"
              r="calc(50% - 2px)"
              fill="none"
              stroke={colors.shadow}
              strokeWidth="1.5"
              strokeOpacity="0.25"
              strokeLinecap="round"
            />
          </svg>
          <div className="orb-loading-glow" />
        </>
      )}

      {/* Ripple effect on tap */}
      {ripple && (
        <div
          className="orb-ripple"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.3)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
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
