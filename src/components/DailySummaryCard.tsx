import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, ArrowRight } from "lucide-react";
import { useDailySessions } from "@/hooks/useDailySessions";
import { useNavigate } from "react-router-dom";

export const DailySummaryCard = () => {
  const { todaySession, isLoading } = useDailySessions();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="p-4 bg-card border-border/40 animate-pulse">
        <div className="h-20" />
      </Card>
    );
  }

  // No session today
  if (!todaySession) {
    return (
      <Card className="p-4 bg-card border-border/40 hover:border-border transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-light text-foreground">Daily Session</p>
              <p className="text-xs text-muted-foreground">Start your day with intention</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/daily-session')}
            className="gap-2"
          >
            Start
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // Session in progress or completed
  const hasTopFocus = todaySession.top_focus;
  const hasReflection = todaySession.reflection_wins;
  const nextBlock = todaySession.deep_work_blocks?.[0];

  return (
    <Card className="p-4 bg-card border-border/40 hover:border-border transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-light text-foreground">Today's Focus</p>
              {hasTopFocus ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {todaySession.top_focus}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">In progress...</p>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/daily-session')}
            className="gap-2"
          >
            {hasReflection ? 'View' : 'Continue'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {nextBlock && (
          <div className="pl-8 pt-1 border-l-2 border-border/40">
            <p className="text-xs text-muted-foreground">Next block</p>
            <p className="text-xs font-light text-foreground">
              {nextBlock.start} - {nextBlock.end}: {nextBlock.description}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
