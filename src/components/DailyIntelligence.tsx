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

interface AIAlerts {
  headline: string;
  deadlines: {
    due_tomorrow: string[];
    due_soon: string[];
    overdue: string[];
    missing_preparation: string[];
  };
  followups: {
    task: string;
    person: string | null;
    days_waiting: number;
  }[];
  risk_count: number;
}

interface AIPatterns {
  habits: string[];
  anti_habits: string[];
  peak_energy_times: string[];
  avoidance_patterns: string[];
  stress_triggers: string[];
  opportunity_zones: string[];
}

interface AIPreferences {
  preferred_task_length: string;
  preferred_daily_load: number;
  preferred_times: string[];
  task_style: string;
  energy_curve: string;
  notification_style: string;
}

interface AIPredictions {
  likely_state: string;
  risk_of_overwhelm: number;
  recommended_focus_window: string;
  recommended_workload: number;
  motivational_suggestion: string;
}

interface AIProactive {
  headline: string;
  suggestions: string[];
  warnings: string[];
  opportunities: string[];
  energy_timing: string;
  micro_habits: string[];
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
  aiAlerts?: AIAlerts | null;
  aiPatterns?: AIPatterns | null;
  aiPreferences?: AIPreferences | null;
  aiPredictions?: AIPredictions | null;
  aiProactive?: AIProactive | null;
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
  aiPlan,
  aiAlerts,
  aiPatterns,
  aiPreferences,
  aiPredictions,
  aiProactive
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
        {/* AI Alerts - Show first if present */}
        {aiAlerts && (
          <div className="pb-3 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-medium font-mono">⚠️ Attention Needed</h3>
            </div>
            <p className="text-sm text-destructive mb-3">{aiAlerts.headline}</p>
            
            {(aiAlerts.deadlines.overdue.length > 0 || 
              aiAlerts.deadlines.due_tomorrow.length > 0 || 
              aiAlerts.deadlines.missing_preparation.length > 0 || 
              aiAlerts.deadlines.due_soon.length > 0) && (
              <div className="mb-3">
                <h4 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground mb-2">Deadlines</h4>
                <ul className="space-y-1">
                  {aiAlerts.deadlines.overdue.map((deadline, idx) => (
                    <li key={`overdue-${idx}`} className="text-sm text-destructive flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>{deadline} (overdue)</span>
                    </li>
                  ))}
                  {aiAlerts.deadlines.due_tomorrow.map((deadline, idx) => (
                    <li key={`tomorrow-${idx}`} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>{deadline} (due tomorrow)</span>
                    </li>
                  ))}
                  {aiAlerts.deadlines.missing_preparation.map((deadline, idx) => (
                    <li key={`prep-${idx}`} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>{deadline} (needs prep)</span>
                    </li>
                  ))}
                  {aiAlerts.deadlines.due_soon.map((deadline, idx) => (
                    <li key={`soon-${idx}`} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{deadline} (due soon)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {aiAlerts.followups.length > 0 && (
              <div>
                <h4 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground mb-2">Follow-ups</h4>
                <ul className="space-y-1">
                  {aiAlerts.followups.map((followup, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>
                        {followup.task}
                        {followup.person && ` (${followup.person})`}
                        <span className="text-muted-foreground ml-1">
                          - {followup.days_waiting}d waiting
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
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

        {/* AI Proactive Suggestions */}
        {aiProactive && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium font-mono">Proactive Guidance</h3>
            </div>
            
            <p className="text-sm font-medium">{aiProactive.headline}</p>
            
            {aiProactive.suggestions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground mb-2">Suggestions</h4>
                <ul className="space-y-1">
                  {aiProactive.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiProactive.warnings.length > 0 && (
              <div>
                <h4 className="text-xs font-medium font-mono uppercase tracking-wide text-destructive mb-2">Watch Out</h4>
                <ul className="space-y-1">
                  {aiProactive.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-destructive flex items-start gap-2">
                      <span>⚠️</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiProactive.opportunities.length > 0 && (
              <div>
                <h4 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground mb-2">Opportunities</h4>
                <ul className="space-y-1">
                  {aiProactive.opportunities.map((opp, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-success">✓</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiProactive.energy_timing && (
              <div className="bg-muted/30 p-2 rounded text-xs text-muted-foreground">
                ⏰ Best time for focus: {aiProactive.energy_timing}
              </div>
            )}

            {aiProactive.micro_habits.length > 0 && (
              <div>
                <h4 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground mb-2">Micro Habits</h4>
                <ul className="space-y-1">
                  {aiProactive.micro_habits.map((habit, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span>→</span>
                      <span>{habit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* AI Predictions */}
        {aiPredictions && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-foreground-soft" />
              <h3 className="text-sm font-medium font-mono">Behavioral Prediction</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Likely state:</span>
                <span className="text-sm font-medium">{aiPredictions.likely_state}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Overwhelm risk:</span>
                <span className="text-sm font-medium">{aiPredictions.risk_of_overwhelm}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Recommended focus:</span>
                <span className="text-sm font-medium">{aiPredictions.recommended_focus_window}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Daily workload:</span>
                <span className="text-sm font-medium">{aiPredictions.recommended_workload} tasks</span>
              </div>
            </div>
            
            {aiPredictions.motivational_suggestion && (
              <p className="text-sm text-muted-foreground italic mt-2">
                {aiPredictions.motivational_suggestion}
              </p>
            )}
          </div>
        )}

        {/* AI Patterns */}
        {aiPatterns && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-foreground-soft" />
              <h3 className="text-sm font-medium font-mono">Patterns Detected</h3>
            </div>
            
            {aiPatterns.habits.length > 0 && (
              <div>
                <h4 className="text-xs font-medium font-mono uppercase tracking-wide text-success mb-1">Positive Habits</h4>
                <ul className="space-y-0.5">
                  {aiPatterns.habits.slice(0, 3).map((habit, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">✓ {habit}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiPatterns.anti_habits.length > 0 && (
              <div>
                <h4 className="text-xs font-medium font-mono uppercase tracking-wide text-destructive mb-1">Anti-Habits</h4>
                <ul className="space-y-0.5">
                  {aiPatterns.anti_habits.slice(0, 2).map((habit, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">✗ {habit}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiPatterns.peak_energy_times.length > 0 && (
              <div>
                <h4 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground mb-1">Peak Energy</h4>
                <p className="text-sm text-muted-foreground">{aiPatterns.peak_energy_times.join(', ')}</p>
              </div>
            )}

            {aiPatterns.opportunity_zones.length > 0 && (
              <div>
                <h4 className="text-xs font-medium font-mono uppercase tracking-wide text-muted-foreground mb-1">Growth Opportunities</h4>
                <ul className="space-y-0.5">
                  {aiPatterns.opportunity_zones.slice(0, 2).map((zone, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">→ {zone}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* AI Preferences */}
        {aiPreferences && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-foreground-soft" />
              <h3 className="text-sm font-medium font-mono">Learned Preferences</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Task style:</span>
                <span className="ml-1 font-medium">{aiPreferences.task_style}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Energy curve:</span>
                <span className="ml-1 font-medium">{aiPreferences.energy_curve}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Daily load:</span>
                <span className="ml-1 font-medium">{aiPreferences.preferred_daily_load} tasks</span>
              </div>
              <div>
                <span className="text-muted-foreground">Task length:</span>
                <span className="ml-1 font-medium">{aiPreferences.preferred_task_length}</span>
              </div>
            </div>
            
            {aiPreferences.preferred_times.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Best times: {aiPreferences.preferred_times.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
