import { useState, useEffect } from 'react';

const FastingTimer = () => {
  const [fastStartTime, setFastStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  
  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('malunita_fast_start');
    if (stored) {
      setFastStartTime(new Date(stored));
    }
  }, []);
  
  // Update timer every second
  useEffect(() => {
    if (!fastStartTime) return;
    
    const updateElapsed = () => {
      const now = new Date();
      const diff = now.getTime() - fastStartTime.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsed(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [fastStartTime]);
  
  const startFast = () => {
    const now = new Date();
    setFastStartTime(now);
    localStorage.setItem('malunita_fast_start', now.toISOString());
  };
  
  const endFast = () => {
    setFastStartTime(null);
    localStorage.removeItem('malunita_fast_start');
    setElapsed('00:00:00');
  };

  // Calculate progress (assuming 16-hour fast goal)
  const fastGoalHours = 16;
  const elapsedHours = fastStartTime 
    ? (Date.now() - fastStartTime.getTime()) / (1000 * 60 * 60)
    : 0;
  const progress = Math.min(elapsedHours / fastGoalHours, 1);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex items-center justify-between py-4">
      {/* Circular timer */}
      <div className="relative w-20 h-20">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-foreground/10"
          />
          {/* Progress arc */}
          {fastStartTime && (
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-foreground/40 transition-all duration-1000"
            />
          )}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-sm text-foreground/70">
            {elapsed.split(':').slice(0, 2).join(':')}
          </p>
          <p className="text-[8px] text-foreground/40 uppercase tracking-wide">
            {fastStartTime ? 'fasted' : 'start'}
          </p>
        </div>
      </div>
      
      {/* Start/End button */}
      {fastStartTime ? (
        <button
          onClick={endFast}
          className="text-xs text-foreground/40 hover:text-foreground/60 px-3 py-1.5 border border-foreground/10 rounded hover:border-foreground/20 transition-colors"
        >
          End fast
        </button>
      ) : (
        <button
          onClick={startFast}
          className="text-xs text-foreground/50 hover:text-foreground/70 px-3 py-1.5 border border-foreground/10 rounded hover:border-foreground/20 transition-colors"
        >
          Start fast
        </button>
      )}
    </div>
  );
};

export default FastingTimer;
