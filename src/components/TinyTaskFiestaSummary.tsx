import { useEffect } from "react";
import { FiestaSession } from "@/hooks/useFiestaSessions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, RotateCcw, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

interface TinyTaskFiestaSummaryProps {
  session: FiestaSession;
}

export const TinyTaskFiestaSummary = ({ session }: TinyTaskFiestaSummaryProps) => {
  const navigate = useNavigate();
  const completionRate = session.completion_rate || 0;
  const tasksCompleted = session.tasks_completed.length;
  const totalTasks = session.tasks_included.length;

  useEffect(() => {
    // Trigger confetti only if completion rate is high enough
    if (completionRate >= 75) {
      const duration = completionRate === 100 ? 3000 : 2000;
      const end = Date.now() + duration;

      const colors = ['#E8DCC8', '#1A1A1A', '#8B7355'];

      (function frame() {
        confetti({
          particleCount: completionRate === 100 ? 3 : 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
          disableForReducedMotion: true,
        });
        confetti({
          particleCount: completionRate === 100 ? 3 : 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
          disableForReducedMotion: true,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [completionRate]);

  const getMessage = () => {
    if (completionRate === 100) {
      return "Perfect fiesta! You cleared everything.";
    } else if (completionRate >= 75) {
      return "Amazing work! You crushed most of your tasks.";
    } else if (completionRate >= 50) {
      return "Great progress! You're making headway.";
    } else if (completionRate >= 25) {
      return "Nice start! Every task completed counts.";
    } else {
      return "You gave it a shot. Progress is progress.";
    }
  };

  const getIcon = () => {
    if (completionRate === 100) {
      return <Sparkles className="w-16 h-16 text-primary animate-pulse" />;
    } else if (completionRate >= 50) {
      return <CheckCircle2 className="w-16 h-16 text-primary" />;
    } else {
      return <Clock className="w-16 h-16 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-4 space-y-6 py-12">
        {/* Summary Card */}
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              {getIcon()}
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-4xl font-light tracking-tight font-mono">
                Fiesta Complete
              </h1>
              <p className="text-lg text-muted-foreground font-light">
                {getMessage()}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto pt-6">
              <div className="space-y-2">
                <p className="text-4xl font-mono font-light text-primary tabular-nums">
                  {tasksCompleted}
                </p>
                <p className="text-xs text-muted-foreground font-light uppercase tracking-wider">
                  Completed
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-mono font-light text-foreground tabular-nums">
                  {totalTasks}
                </p>
                <p className="text-xs text-muted-foreground font-light uppercase tracking-wider">
                  Total
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-mono font-light text-primary tabular-nums">
                  {Math.round(completionRate)}%
                </p>
                <p className="text-xs text-muted-foreground font-light uppercase tracking-wider">
                  Rate
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground font-light">
              <Clock className="w-4 h-4" />
              <span>{session.duration_minutes} minute sprint</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
            className="flex-1 gap-2 font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <Button
            onClick={() => window.location.reload()}
            size="lg"
            className="flex-1 gap-2 font-mono"
          >
            <RotateCcw className="w-4 h-4" />
            Start Another Fiesta
          </Button>
        </div>

        {/* Reflection */}
        {completionRate < 100 && totalTasks - tasksCompleted > 0 && (
          <Card className="p-6 bg-card border-border/50">
            <div className="space-y-3">
              <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
                Reflection
              </h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                You have {totalTasks - tasksCompleted} task{totalTasks - tasksCompleted > 1 ? 's' : ''} remaining. 
                Consider scheduling another fiesta or moving them to your main task list for later.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
