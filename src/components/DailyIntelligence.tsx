import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Zap, TrendingUp, MessageCircle, Brain } from "lucide-react";

interface Task {
  id: string;
  title: string;
  category?: string;
}

interface DailyIntelligenceProps {
  topPriorities?: Task[];
  followUps?: Task[];
  quickWins?: Task[];
  clarificationsNeeded?: Task[];
  overloadWarning?: boolean;
  taskPatterns?: string[];
  emotionalTone?: string;
}

export function DailyIntelligence({
  topPriorities = [],
  followUps = [],
  quickWins = [],
  clarificationsNeeded = [],
  overloadWarning = false,
  taskPatterns = [],
  emotionalTone
}: DailyIntelligenceProps) {
  
  return (
    <Card className="p-6 mb-6 border border-border rounded-[10px] shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-lg font-medium mb-5 font-mono">Daily Intelligence</h2>
      
      <div className="space-y-5">
        {/* STATIC SECTIONS - Always show */}
        
        {/* Top Priorities */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-foreground-soft" />
            <h3 className="text-sm font-medium font-mono">Top Priorities</h3>
          </div>
          {topPriorities.length > 0 ? (
            <div className="space-y-2">
              {topPriorities.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No priorities set for today</p>
          )}
        </div>

        {/* Follow-Ups */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-foreground-soft" />
            <h3 className="text-sm font-medium font-mono">Follow-Ups</h3>
          </div>
          {followUps.length > 0 ? (
            <div className="space-y-2">
              {followUps.map((task) => (
                <div key={task.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">All caught up on follow-ups</p>
          )}
        </div>

        {/* Quick Wins */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-foreground-soft" />
            <h3 className="text-sm font-medium font-mono">Quick Wins</h3>
          </div>
          {quickWins.length > 0 ? (
            <div className="space-y-2">
              {quickWins.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No quick wins available</p>
          )}
        </div>

        {/* DYNAMIC SECTIONS - Only when relevant */}
        
        {clarificationsNeeded && clarificationsNeeded.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-medium font-mono">Clarifications Needed</h3>
            </div>
            <div className="space-y-2">
              {clarificationsNeeded.map((task) => (
                <div key={task.id} className="flex items-start gap-2 text-sm text-destructive">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {overloadWarning && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <h3 className="text-sm font-medium font-mono">Overload Warning</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              You have a high number of tasks today. Consider delegating or deferring some items.
            </p>
          </div>
        )}

        {taskPatterns && taskPatterns.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-foreground-soft" />
              <h3 className="text-sm font-medium font-mono">Task Patterns</h3>
            </div>
            <div className="space-y-1">
              {taskPatterns.map((pattern, idx) => (
                <p key={idx} className="text-sm text-muted-foreground">{pattern}</p>
              ))}
            </div>
          </div>
        )}

        {emotionalTone && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-foreground-soft" />
              <h3 className="text-sm font-medium font-mono">Emotional Tone</h3>
            </div>
            <p className="text-sm text-muted-foreground">{emotionalTone}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
