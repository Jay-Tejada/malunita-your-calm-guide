import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ActiveSessionBarProps {
  session: {
    id: string;
    title: string;
    started_at: string;
    target_duration_minutes: number;
  };
  onTap: () => void;
  onEnd: () => void;
}

const ActiveSessionBar = ({ session, onTap, onEnd }: ActiveSessionBarProps) => {
  const [minutesLeft, setMinutesLeft] = useState(session.target_duration_minutes);
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const started = new Date(session.started_at).getTime();
      const now = Date.now();
      const elapsedMinutes = Math.floor((now - started) / 60000);
      const remaining = session.target_duration_minutes - elapsedMinutes;
      
      if (remaining <= 0) {
        setIsOvertime(true);
        setMinutesLeft(Math.abs(remaining));
      } else {
        setIsOvertime(false);
        setMinutesLeft(remaining);
      }
    };

    updateTime();
    // Update every 30 seconds (calm, not aggressive)
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [session.started_at, session.target_duration_minutes]);

  // Progress percentage
  const started = new Date(session.started_at).getTime();
  const elapsed = Date.now() - started;
  const total = session.target_duration_minutes * 60000;
  const progress = Math.min(elapsed / total, 1);

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      {/* Progress bar background */}
      <div className="h-1 bg-foreground/5">
        <div 
          className={`h-full transition-all duration-1000 ${
            isOvertime ? 'bg-amber-500/50' : 'bg-foreground/20'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      
      {/* Info bar */}
      <button
        onClick={onTap}
        className="w-full flex items-center justify-between px-4 py-2 bg-foreground/[0.02] border-b border-foreground/5 hover:bg-foreground/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-foreground/30 animate-pulse" />
          <span className="text-xs font-mono text-foreground/60">
            {session.title}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono ${
            isOvertime ? 'text-amber-500/70' : 'text-foreground/40'
          }`}>
            {isOvertime ? '+' : ''}{minutesLeft} min {isOvertime ? 'over' : 'left'}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnd();
            }}
            className="p-1 text-foreground/30 hover:text-foreground/50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </button>
    </div>
  );
};

export default ActiveSessionBar;