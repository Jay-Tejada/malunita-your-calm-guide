import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Zap, TrendingUp, MessageCircle, Brain } from "lucide-react";

interface Task {
  id: string;
  title: string;
  category?: string;
}

interface AISummary {
  decisions: string[];
  ideas: string[];
  clarifyingQuestions: string[];
  emotion: string;
  focus: string | null;
}

interface AIPlan {
  top_priority: string;
  must_do: string[];
  should_do: string[];
  could_do: string[];
  quick_wins: string[];
  warnings: string[];
  day_theme: string;
  reasoning: string;
}

interface DailyIntelligenceProps {
  topPriorities?: Task[];
  followUps?: Task[];
  quickWins?: Task[];
  clarificationsNeeded?: Task[];
  overloadWarning?: boolean;
  taskPatterns?: string[];
  emotionalTone?: string;
  aiSummary?: AISummary | null;
  aiPlan?: AIPlan | null;
}

export function DailyIntelligence({
  topPriorities = [],
  followUps = [],
  quickWins = [],
  clarificationsNeeded = [],
  overloadWarning = false,
  taskPatterns = [],
  emotionalTone,
  aiSummary,
  aiPlan
}: DailyIntelligenceProps) {
  
  const getEmotionLabel = (emotion: string) => {
    const labels: Record<string, string> = {
      stressed: "You sound stressed",
      ok: "You sound calm",
      motivated: "You sound optimistic"
    };
    return labels[emotion] || `You sound ${emotion}`;
  };
  
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

        {/* AI Summary from process-input */}
        {aiSummary && (
          <>
            {aiSummary.emotion && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">{getEmotionLabel(aiSummary.emotion)}</p>
              </div>
            )}

            {aiSummary.decisions.length > 0 && (
              <div className="pt-2 border-t border-border">
                <h3 className="text-sm font-medium font-mono mb-2">Decisions You May Need to Make</h3>
                <ul className="space-y-1">
                  {aiSummary.decisions.map((decision, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiSummary.ideas.length > 0 && (
              <div className="pt-2 border-t border-border">
                <h3 className="text-sm font-medium font-mono mb-2">Ideas You Mentioned</h3>
                <ul className="space-y-1">
                  {aiSummary.ideas.map((idea, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiSummary.clarifyingQuestions.length > 0 && (
              <div className="pt-2 border-t border-border">
                <h3 className="text-sm font-medium font-mono mb-2">Malunita Wants to Clarify</h3>
                <ul className="space-y-1">
                  {aiSummary.clarifyingQuestions.map((question, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* AI Plan from daily-prioritization */}
        {aiPlan && (
          <>
            {aiPlan.top_priority && (
              <div className="pt-3 space-y-1">
                <h3 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground">The One Thing</h3>
                <p className="text-sm">{aiPlan.top_priority}</p>
              </div>
            )}

            {aiPlan.must_do.length > 0 && (
              <div className="pt-3 space-y-1">
                <h3 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground">Must Do</h3>
                <ul className="space-y-0.5">
                  {aiPlan.must_do.map((task, idx) => (
                    <li key={idx} className="text-sm text-foreground">{task}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiPlan.should_do.length > 0 && (
              <div className="pt-3 space-y-1">
                <h3 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground">Should Do</h3>
                <ul className="space-y-0.5">
                  {aiPlan.should_do.map((task, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{task}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiPlan.quick_wins.length > 0 && (
              <div className="pt-3 space-y-1">
                <h3 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground">Quick Wins</h3>
                <ul className="space-y-0.5">
                  {aiPlan.quick_wins.map((task, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{task}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiPlan.day_theme && (
              <div className="pt-3">
                <p className="text-sm italic text-muted-foreground">{aiPlan.day_theme}</p>
              </div>
            )}

            {aiPlan.warnings.length > 0 && (
              <div className="pt-3 space-y-1">
                <h3 className="text-xs font-medium font-mono uppercase tracking-wide text-destructive">Warnings</h3>
                <ul className="space-y-0.5">
                  {aiPlan.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-destructive">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
