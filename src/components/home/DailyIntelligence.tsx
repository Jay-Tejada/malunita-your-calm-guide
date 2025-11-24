import { Card } from "@/components/ui/card";
import { Lightbulb, Target, Zap } from "lucide-react";

interface DailyIntelligenceProps {
  summary?: string | null;
  quickWins?: Array<{ id: string; title: string }>;
  focusMessage?: string | null;
  oneThing?: string | null;
}

export function DailyIntelligence({ summary, quickWins, focusMessage, oneThing }: DailyIntelligenceProps) {
  // Render nothing if no data
  if (!summary && (!quickWins || quickWins.length === 0) && !focusMessage && !oneThing) {
    return null;
  }

  return (
    <Card className="p-6 space-y-6">
      {/* ONE Thing Section */}
      {oneThing && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Your ONE Thing Today
            </h3>
          </div>
          <p className="text-sm text-foreground font-medium pl-6">
            {oneThing}
          </p>
        </div>
      )}

      {/* Focus Message Section */}
      {focusMessage && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Focus Insight
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-6">
            {focusMessage}
          </p>
        </div>
      )}

      {/* Today's Overview Section */}
      {summary && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Today's Overview
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      )}

      {/* Quick Wins Section */}
      {quickWins && quickWins.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Quick Wins
            </h3>
          </div>
          <ul className="space-y-1.5 pl-6">
            {quickWins.map((win) => (
              <li key={win.id} className="text-sm text-muted-foreground pl-4 relative">
                <span className="absolute left-0 top-0">•</span>
                {win.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
