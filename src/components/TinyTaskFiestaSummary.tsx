import { FiestaSession } from "@/hooks/useFiestaSessions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TinyTaskFiestaSummaryProps {
  session: FiestaSession;
}

export const TinyTaskFiestaSummary = ({ session }: TinyTaskFiestaSummaryProps) => {
  const navigate = useNavigate();
  const completionRate = session.completion_rate || 0;
  const tasksCompleted = session.tasks_completed.length;
  const totalTasks = session.tasks_included.length;

  const getMessage = () => {
    if (completionRate === 100) {
      return "Perfect fiesta! You cleared everything! 🎉";
    } else if (completionRate >= 75) {
      return "Amazing work! You crushed most of your tasks!";
    } else if (completionRate >= 50) {
      return "Great progress! You're making headway!";
    } else if (completionRate >= 25) {
      return "Nice start! Every task completed counts!";
    } else {
      return "You gave it a shot! Progress is progress.";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
            {completionRate === 100 && (
              <Trophy className="w-8 h-8 absolute -top-2 -right-2 text-yellow-500" />
            )}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Fiesta Complete!</h2>
            <p className="text-xl text-muted-foreground">{getMessage()}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-primary">{tasksCompleted}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-primary">{totalTasks}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-primary">{Math.round(completionRate)}%</p>
              <p className="text-sm text-muted-foreground">Rate</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{session.duration_minutes} minute sprint</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="flex-1"
        >
          Back to Home
        </Button>
        <Button
          onClick={() => window.location.reload()}
          className="flex-1"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Start Another Fiesta
        </Button>
      </div>
    </div>
  );
};
