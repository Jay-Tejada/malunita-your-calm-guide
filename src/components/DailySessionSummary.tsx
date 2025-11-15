import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Lightbulb, Star } from "lucide-react";
import { DailySession } from "@/hooks/useDailySessions";

interface DailySessionSummaryProps {
  session: DailySession;
  onClose: () => void;
}

export const DailySessionSummary = ({ session, onClose }: DailySessionSummaryProps) => {
  const hasReflection = session.reflection_wins || session.reflection_improve || session.reflection_gratitude;
  const isComplete = session.top_focus && hasReflection;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
        <h2 className="text-2xl font-light text-foreground">
          {isComplete ? 'Session Complete' : 'In Progress'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {new Date(session.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      <div className="space-y-4">
        {/* Top Focus */}
        {session.top_focus && (
          <Card className="p-4 bg-card border-border/40">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Top Focus</p>
                <p className="text-sm font-light text-foreground">{session.top_focus}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Priorities */}
        {(session.priority_two || session.priority_three) && (
          <Card className="p-4 bg-card border-border/40">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Other Priorities</p>
                {session.priority_two && (
                  <p className="text-sm font-light text-foreground">• {session.priority_two}</p>
                )}
                {session.priority_three && (
                  <p className="text-sm font-light text-foreground">• {session.priority_three}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Deep Work Blocks */}
        {session.deep_work_blocks && session.deep_work_blocks.length > 0 && (
          <Card className="p-4 bg-card border-border/40">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Deep Work Blocks</p>
                {session.deep_work_blocks.map((block, index) => (
                  <p key={index} className="text-sm font-light text-foreground">
                    {block.start} - {block.end}: {block.description}
                  </p>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Idea Dump */}
        {session.idea_dump_processed && session.idea_dump_processed.length > 0 && (
          <Card className="p-4 bg-card border-border/40">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Tasks Captured</p>
                <p className="text-sm font-light text-foreground">
                  {session.idea_dump_processed.length} tasks extracted from your brain dump
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Reflection */}
        {hasReflection && (
          <div className="space-y-4">
            <div className="border-t border-border/40 pt-4">
              <p className="text-xs text-muted-foreground mb-4">Evening Reflection</p>
            </div>

            {session.reflection_wins && (
              <Card className="p-4 bg-card border-border/40">
                <p className="text-xs text-muted-foreground mb-2">What Went Well</p>
                <p className="text-sm font-light text-foreground">{session.reflection_wins}</p>
              </Card>
            )}

            {session.reflection_improve && (
              <Card className="p-4 bg-card border-border/40">
                <p className="text-xs text-muted-foreground mb-2">Can Improve</p>
                <p className="text-sm font-light text-foreground">{session.reflection_improve}</p>
              </Card>
            )}

            {session.reflection_gratitude && (
              <Card className="p-4 bg-card border-border/40">
                <p className="text-xs text-muted-foreground mb-2">Grateful For</p>
                <p className="text-sm font-light text-foreground">{session.reflection_gratitude}</p>
              </Card>
            )}

            {session.tomorrow_focus && (
              <Card className="p-4 bg-card border-border/40">
                <p className="text-xs text-muted-foreground mb-2">Tomorrow's Start</p>
                <p className="text-sm font-light text-foreground">{session.tomorrow_focus}</p>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>
    </div>
  );
};
