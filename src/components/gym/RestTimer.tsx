import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface RestTimerProps {
  autoStart?: boolean;
  defaultSeconds?: number;
  onComplete?: () => void;
}

const RestTimer = ({ 
  autoStart = false, 
  defaultSeconds = 90,
  onComplete 
}: RestTimerProps) => {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [showTimer, setShowTimer] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Preset rest times
  const presets = [60, 90, 120, 180];
  
  useEffect(() => {
    if (autoStart) {
      setShowTimer(true);
      setIsRunning(true);
      setSeconds(defaultSeconds);
    }
  }, [autoStart, defaultSeconds]);
  
  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setIsRunning(false);
            
            // Haptic feedback (mobile) - pattern: buzz, pause, buzz
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            
            // Optional soft sound
            try {
              const audio = new Audio('/sounds/gentle-chime.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {}); // Ignore if blocked
            } catch {}
            
            onComplete?.();
            return 0;
          }
          
          // Warning at 10 seconds
          if (s === 10 && navigator.vibrate) {
            navigator.vibrate(100);
          }
          
          return s - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, onComplete]);
  
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };
  
  const progress = 1 - (seconds / defaultSeconds);
  const circumference = 2 * Math.PI * 24;
  
  const reset = (newSeconds?: number) => {
    setSeconds(newSeconds || defaultSeconds);
    setIsRunning(false);
  };
  
  const start = (secs?: number) => {
    if (secs) setSeconds(secs);
    setShowTimer(true);
    setIsRunning(true);
  };

  if (!showTimer) {
    return (
      <button
        onClick={() => start()}
        className="flex items-center gap-2 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
      >
        <Play className="w-3 h-3" />
        Start rest timer
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-foreground/[0.02] rounded-lg animate-fade-in">
      {/* Circular progress */}
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-foreground/10"
          />
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className={`transition-all duration-1000 ${
              seconds <= 10 ? 'text-amber-500/70' : 'text-foreground/40'
            }`}
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono text-sm ${
            seconds <= 10 ? 'text-amber-500/70' : 'text-foreground/70'
          }`}>
            {formatTime(seconds)}
          </span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
          Rest
        </p>
        
        {/* Preset buttons */}
        <div className="flex gap-1">
          {presets.map(preset => (
            <button
              key={preset}
              onClick={() => reset(preset)}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                defaultSeconds === preset 
                  ? 'bg-foreground/10 text-foreground/60' 
                  : 'text-foreground/40 hover:bg-foreground/5'
              }`}
            >
              {preset >= 60 ? `${preset / 60}m` : `${preset}s`}
            </button>
          ))}
        </div>
      </div>
      
      {/* Play/Pause/Reset */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-2 text-foreground/40 hover:text-foreground/60 transition-colors"
        >
          {isRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => reset()}
          className="p-2 text-foreground/40 hover:text-foreground/60 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RestTimer;