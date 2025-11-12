import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface WakeWordIndicatorProps {
  isListening: boolean;
  wakeWord?: string;
  detectionTrigger?: number;
}

export const WakeWordIndicator = ({ isListening, wakeWord = 'hey malunita', detectionTrigger }: WakeWordIndicatorProps) => {
  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    if (detectionTrigger) {
      setShowRipple(true);
      const timer = setTimeout(() => setShowRipple(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [detectionTrigger]);

  if (!isListening) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="relative">
        {/* Ripple Effect */}
        {showRipple && (
          <>
            <span className="absolute inset-0 -m-8 rounded-full bg-primary/30 animate-[ping_0.6s_ease-out]" />
            <span className="absolute inset-0 -m-12 rounded-full bg-primary/20 animate-[ping_0.8s_ease-out]" style={{ animationDelay: '0.1s' }} />
            <span className="absolute inset-0 -m-16 rounded-full bg-primary/10 animate-[ping_1s_ease-out]" style={{ animationDelay: '0.2s' }} />
          </>
        )}
        
        {/* Main Indicator */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full shadow-lg transition-all duration-300",
          showRipple && "scale-110 bg-primary/20 border-primary/40"
        )}>
          <div className="relative">
            <Mic className="w-4 h-4 text-primary" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-primary">Listening</span>
            <span className="text-[10px] text-muted-foreground">Say "{wakeWord}"</span>
          </div>
        </div>
      </div>
    </div>
  );
};