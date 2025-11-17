import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface TinyTaskFiestaTimerProps {
  durationMinutes: number;
  startedAt: string;
  onComplete: () => void;
  isPaused?: boolean;
  totalPausedTime?: number;
}

export const TinyTaskFiestaTimer = ({ 
  durationMinutes, 
  startedAt, 
  onComplete,
  isPaused = false,
  totalPausedTime = 0
}: TinyTaskFiestaTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isPaused) return;

    const totalSeconds = durationMinutes * 60;
    const startTime = new Date(startedAt).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime - totalPausedTime) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      
      setTimeLeft(remaining);
      setProgress((remaining / totalSeconds) * 100);

      if (remaining === 0) {
        onComplete();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [durationMinutes, startedAt, onComplete, isPaused, totalPausedTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Calculate completion percentage for visual feedback
  const completionPercentage = 100 - progress;
  const getTimerColor = () => {
    if (completionPercentage < 25) return "text-foreground";
    if (completionPercentage < 50) return "text-foreground";
    if (completionPercentage < 75) return "text-primary";
    return "text-primary";
  };

  return (
    <Card className="p-8 bg-card border-border/50 shadow-sm">
      <div className="space-y-6">
        {/* Timer Display */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <p className="text-xs font-mono uppercase tracking-wider">
              {isPaused ? 'Paused' : 'Time Remaining'}
            </p>
          </div>
          <div className={`text-7xl font-mono font-light tabular-nums tracking-tight transition-colors ${getTimerColor()}`}>
            {String(minutes).padStart(2, '0')}
            <span className="text-muted-foreground">:</span>
            {String(seconds).padStart(2, '0')}
          </div>
          <p className="text-xs text-muted-foreground font-light">
            {durationMinutes} minute sprint
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={progress} 
            className="h-2 bg-muted"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
            <span>{Math.round(completionPercentage)}% complete</span>
            <span>{Math.round(progress)}% remaining</span>
          </div>
        </div>

        {/* Motivational Text */}
        {!isPaused && (
          <div className="text-center">
            {completionPercentage < 25 && (
              <p className="text-sm text-muted-foreground font-light">
                Just getting started...
              </p>
            )}
            {completionPercentage >= 25 && completionPercentage < 50 && (
              <p className="text-sm text-muted-foreground font-light">
                Finding your flow...
              </p>
            )}
            {completionPercentage >= 50 && completionPercentage < 75 && (
              <p className="text-sm text-primary font-light">
                Halfway there! Keep going.
              </p>
            )}
            {completionPercentage >= 75 && completionPercentage < 100 && (
              <p className="text-sm text-primary font-light">
                Almost done! Finish strong.
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
