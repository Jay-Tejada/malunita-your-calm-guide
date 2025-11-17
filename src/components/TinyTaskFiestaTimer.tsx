import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TinyTaskFiestaTimerProps {
  durationMinutes: number;
  startedAt: string;
  onComplete: () => void;
}

export const TinyTaskFiestaTimer = ({ durationMinutes, startedAt, onComplete }: TinyTaskFiestaTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const totalSeconds = durationMinutes * 60;
    const startTime = new Date(startedAt).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
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
  }, [durationMinutes, startedAt, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Card className="p-6 space-y-4">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground font-mono">Time Remaining</p>
        <p className="text-4xl font-bold font-mono tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>
      </div>
      <Progress value={progress} className="h-2" />
    </Card>
  );
};
