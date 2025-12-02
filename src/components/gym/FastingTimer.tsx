import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

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

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-foreground/[0.02] rounded-lg">
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4 text-foreground/40" />
        <div>
          <p className="font-mono text-lg text-foreground/70">{elapsed}</p>
          <p className="text-[10px] text-foreground/40 uppercase tracking-wide">
            {fastStartTime ? 'fasted' : 'not fasting'}
          </p>
        </div>
      </div>
      
      {fastStartTime ? (
        <button
          onClick={endFast}
          className="text-xs text-foreground/40 hover:text-foreground/60 px-3 py-1 border border-foreground/10 rounded"
        >
          End fast
        </button>
      ) : (
        <button
          onClick={startFast}
          className="text-xs text-foreground/50 hover:text-foreground/70 px-3 py-1 border border-foreground/10 rounded"
        >
          Start fast
        </button>
      )}
    </div>
  );
};

export default FastingTimer;
