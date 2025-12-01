import { useState } from "react";
import { SimpleHeader } from '@/components/SimpleHeader';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, Target, Clock, Calendar, Lightbulb, Zap, CheckCircle2, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWeeklyInsights } from "@/hooks/useWeeklyInsights";
import { useWeeklyRecommendations } from "@/hooks/useWeeklyRecommendations";
import { useFocusStreak } from "@/hooks/useFocusStreak";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { FocusTrends } from "@/components/FocusTrends";

const WeeklyInsights = () => {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const { data: insights, isLoading } = useWeeklyInsights(weekOffset);
  const { streak, isLoading: isLoadingStreak } = useFocusStreak();
  const { data: recommendations, isLoading: isLoadingRecs } = useWeeklyRecommendations(
    insights?.weekStart || '',
    insights?.weekEnd || '',
    insights?.sessions,
    !!insights && weekOffset === 0 // Only fetch for current week
  );

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'productivity': return <Zap className="w-4 h-4" />;
      case 'scheduling': return <Calendar className="w-4 h-4" />;
      case 'consistency': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-accent text-accent-foreground';
      case 'medium': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <SimpleHeader title="Weekly Insights" />
        </div>
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-card rounded-lg" />
            <div className="h-64 bg-card rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  const weekLabel = weekOffset === 0 ? "This Week" : 
                    weekOffset === -1 ? "Last Week" : 
                    `${Math.abs(weekOffset)} Weeks Ago`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <SimpleHeader title="Weekly Insights" />
      </div>
      
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20 md:pb-6">
        <div className="flex items-center justify-between mb-6 md:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-light">Weekly Insights</h1>
              <p className="text-muted-foreground mt-1">
                Patterns and trends from your daily sessions
              </p>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(weekOffset - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm font-light">{weekLabel}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Focus Streak */}
        {!isLoadingStreak && streak && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Flame className="w-4 h-4" />
            <span>Primary Focus Streak: <span className="font-medium text-foreground">{streak.current_streak} days</span> | Longest streak: <span className="font-medium text-foreground">{streak.longest_streak} days</span></span>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-card border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sessions</span>
            </div>
            <p className="text-2xl font-light">{insights?.totalSessions || 0}/7</p>
          </Card>

          <Card className="p-4 bg-card border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Completion</span>
            </div>
            <p className="text-2xl font-light">{insights?.completionRate || 0}%</p>
          </Card>

          <Card className="p-4 bg-card border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Deep Work</span>
            </div>
            <p className="text-2xl font-light">{insights?.deepWorkHours || 0}h</p>
          </Card>

          <Card className="p-4 bg-card border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Consistency</span>
            </div>
            <p className="text-2xl font-light">{insights?.focusConsistency || 0}%</p>
          </Card>
        </div>

        {/* Focus Trends */}
        <div className="mb-8">
          <FocusTrends />
        </div>

        {/* Daily Activity Chart */}
        <Card className="p-6 bg-card border-border/40 mb-8">
          <h3 className="text-sm font-light text-muted-foreground mb-4">Daily Activity</h3>
          <ChartContainer
            config={{
              activity: {
                label: "Activity",
                color: "hsl(var(--foreground))",
              },
            }}
            className="h-48"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights?.dayBreakdown || []}>
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Bar dataKey="hasSession" radius={[8, 8, 0, 0]}>
                  {insights?.dayBreakdown.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.completed ? "hsl(var(--success))" : 
                            entry.hasSession ? "hsl(var(--accent))" : 
                            "hsl(var(--muted))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* AI Recommendations */}
        {weekOffset === 0 && recommendations && recommendations.length > 0 && (
          <Card className="p-6 bg-card border-border/40 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-sm font-light text-muted-foreground">Smart Recommendations</h3>
              {isLoadingRecs && (
                <span className="text-xs text-muted-foreground ml-auto">Analyzing patterns...</span>
              )}
            </div>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className="p-4 bg-background rounded-lg border border-border/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getRecommendationIcon(rec.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-light">{rec.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(rec.priority)}`}
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top Focus Themes */}
        {insights?.topFocusThemes && insights.topFocusThemes.length > 0 && (
          <Card className="p-6 bg-card border-border/40 mb-8">
            <h3 className="text-sm font-light text-muted-foreground mb-4">Recurring Themes</h3>
            <div className="space-y-3">
              {insights.topFocusThemes.map((theme, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-light">{theme.theme}</span>
                      <span className="text-xs text-muted-foreground">{theme.count}x</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-foreground rounded-full"
                        style={{ 
                          width: `${(theme.count / (insights.topFocusThemes[0]?.count || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Insights Summary */}
        <Card className="p-6 bg-card border-border/40">
          <h3 className="text-sm font-light text-muted-foreground mb-4">Summary</h3>
          <div className="space-y-3 text-sm font-light">
            {insights?.totalSessions === 0 ? (
              <p className="text-muted-foreground">No sessions recorded this week.</p>
            ) : (
              <>
                <p>
                  You completed <span className="font-normal">{insights?.completedSessions}</span> out of{" "}
                  <span className="font-normal">{insights?.totalSessions}</span> daily sessions.
                </p>
                {insights && insights.deepWorkHours > 0 && (
                  <p>
                    You logged <span className="font-normal">{insights.deepWorkHours} hours</span> of deep work.
                  </p>
                )}
                {insights && insights.reflectionRate > 0 && (
                  <p>
                    You reflected on <span className="font-normal">{insights.reflectionRate}%</span> of your sessions.
                  </p>
                )}
                {insights && insights.focusConsistency >= 70 && (
                  <p className="text-success">
                    Great consistency! You're building a strong daily practice.
                  </p>
                )}
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default WeeklyInsights;
