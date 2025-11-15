import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import { DailySession } from "@/hooks/useDailySessions";

interface DailySessionHistoryProps {
  sessions: DailySession[];
  onViewSession: (session: DailySession) => void;
}

export const DailySessionHistory = ({ sessions, onViewSession }: DailySessionHistoryProps) => {
  if (!sessions || sessions.length === 0) {
    return (
      <Card className="p-8 bg-card border-border/40 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">
          No previous sessions yet. Start your first daily session above.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-light text-muted-foreground">Previous Sessions</h3>
      
      {sessions.map((session) => {
        const date = new Date(session.date);
        const hasReflection = session.reflection_wins || session.reflection_improve;
        const isComplete = session.top_focus && hasReflection;
        
        return (
          <Card 
            key={session.id}
            className="p-4 bg-card border-border/40 hover:border-border transition-all cursor-pointer"
            onClick={() => onViewSession(session)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-light text-foreground">
                      {date.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    {session.top_focus && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                        {session.top_focus}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isComplete ? (
                  <span className="text-xs text-success">Complete</span>
                ) : session.top_focus ? (
                  <span className="text-xs text-muted-foreground">In progress</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Started</span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
