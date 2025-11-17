import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface TinyTaskFiestaTimerProps {
  durationMinutes: number;
  startedAt: string;
  onComplete: () => void;
  isPaused?: boolean;
  totalPausedTime?: number;
}

export const TinyTaskFiestaTimer = ({ durationMinutes, startedAt, onComplete, isPaused = false, totalPausedTime = 0 }: TinyTaskFiestaTimerProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2">
          <Badge variant={isPaused ? "secondary" : "default"}>
            {isPaused ? "Paused" : "In Progress"}
          </Badge>
        </div>

        {/* Timer Display */}
        <div className="text-center space-y-2">
          <div className="text-6xl font-bold font-mono tracking-tight">
            25:00
          </div>
          <p className="text-sm text-muted-foreground">
            Keep going! You're doing great.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={45} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Started</span>
            <span>45% complete</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
