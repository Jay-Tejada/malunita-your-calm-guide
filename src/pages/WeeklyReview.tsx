import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Flame, Clock, BookOpen, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { hapticLight } from '@/utils/haptics';
import { generateWeeklyReport, WeeklyReport } from '@/utils/generateWeeklyReport';
import { format, parseISO } from 'date-fns';
import { CreatureSprite } from '@/components/CreatureSprite';
import { useProfile } from '@/hooks/useProfile';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES: Record<string, string> = {
  'Monday': 'Mon',
  'Tuesday': 'Tue',
  'Wednesday': 'Wed',
  'Thursday': 'Thu',
  'Friday': 'Fri',
  'Saturday': 'Sat',
  'Sunday': 'Sun',
};

const WeeklyReview = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [weekOffset, setWeekOffset] = useState(0);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      const data = await generateWeeklyReport(weekOffset);
      setReport(data);
      setIsLoading(false);
    };
    loadReport();
  }, [weekOffset]);

  const weekLabel = weekOffset === 0 ? 'This Week' : 
                    weekOffset === -1 ? 'Last Week' : 
                    `${Math.abs(weekOffset)} Weeks Ago`;

  const formatDateRange = () => {
    if (!report) return '';
    return `${format(parseISO(report.weekStart), 'MMM d')} – ${format(parseISO(report.weekEnd), 'MMM d')}`;
  };

  // Get task count for each day
  const getDayActivity = (dayAbbrev: string): number => {
    if (!report) return 0;
    const fullDay = Object.keys(DAY_NAMES).find(k => DAY_NAMES[k] === dayAbbrev);
    return fullDay ? (report.tasksByDay[fullDay] || 0) : 0;
  };

  const maxDayCount = Math.max(...DAYS.map(d => getDayActivity(d)), 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticLight();
                navigate(-1);
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-mono text-lg font-medium">Weekly Review</h1>
              <p className="text-xs text-muted-foreground">{formatDateRange()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            hapticLight();
            setWeekOffset(weekOffset - 1);
          }}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm font-mono text-foreground/60">{weekLabel}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            hapticLight();
            setWeekOffset(weekOffset + 1);
          }}
          disabled={weekOffset >= 0}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 pb-24 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-24 bg-foreground/5 rounded-xl animate-pulse" />
            <div className="h-32 bg-foreground/5 rounded-xl animate-pulse" />
            <div className="h-48 bg-foreground/5 rounded-xl animate-pulse" />
          </div>
        ) : report ? (
          <>
            {/* Summary */}
            <div className="text-center py-4">
              <p className="font-mono text-lg text-foreground/80">{report.summary}</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-foreground/[0.02] border-foreground/5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-[10px] uppercase tracking-wider text-foreground/40">Tasks</span>
                </div>
                <p className="text-2xl font-mono font-light">{report.metrics.tasksCompleted}</p>
                <p className="text-xs text-foreground/40">{report.metrics.avgPerDay}/day avg</p>
              </Card>

              <Card className="p-4 bg-foreground/[0.02] border-foreground/5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-wider text-foreground/40">Focus</span>
                </div>
                <p className="text-2xl font-mono font-light">{report.metrics.focusHours}h</p>
                <p className="text-xs text-foreground/40">{report.metrics.flowSessions} sessions</p>
              </Card>

              <Card className="p-4 bg-foreground/[0.02] border-foreground/5">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-[10px] uppercase tracking-wider text-foreground/40">Habits</span>
                </div>
                <p className="text-2xl font-mono font-light">{report.metrics.habitCompletionRate}%</p>
                <p className="text-xs text-foreground/40">{report.metrics.longestHabitStreak} days active</p>
              </Card>

              <Card className="p-4 bg-foreground/[0.02] border-foreground/5">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] uppercase tracking-wider text-foreground/40">Journal</span>
                </div>
                <p className="text-2xl font-mono font-light">{report.metrics.journalEntries}</p>
                <p className="text-xs text-foreground/40">entries</p>
              </Card>
            </div>

            {/* Daily Activity */}
            <Card className="p-4 bg-foreground/[0.02] border-foreground/5">
              <h3 className="text-[10px] uppercase tracking-wider text-foreground/40 mb-4">Daily Activity</h3>
              <div className="flex items-end justify-between gap-2 h-24">
                {DAYS.map((day) => {
                  const count = getDayActivity(day);
                  const height = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full relative h-20">
                        <div
                          className="absolute bottom-0 w-full bg-foreground/20 rounded-t transition-all"
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-foreground/40">{day}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Insights */}
            {report.insights.length > 0 && (
              <Card className="p-4 bg-foreground/[0.02] border-foreground/5">
                <h3 className="text-[10px] uppercase tracking-wider text-foreground/40 mb-3">Insights</h3>
                <ul className="space-y-2">
                  {report.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-foreground/20 mt-1">•</span>
                      <span className="text-sm text-foreground/70">{insight}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Wins */}
            {report.wins.length > 0 && (
              <Card className="p-4 bg-green-500/5 border-green-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-green-500" />
                  <h3 className="text-[10px] uppercase tracking-wider text-green-600">Wins This Week</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.wins.map((win, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-green-500/10 text-green-700 rounded-full text-xs"
                    >
                      {win}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Top Categories */}
            {report.topCategories.length > 0 && (
              <Card className="p-4 bg-foreground/[0.02] border-foreground/5">
                <h3 className="text-[10px] uppercase tracking-wider text-foreground/40 mb-3">Top Categories</h3>
                <div className="space-y-2">
                  {report.topCategories.slice(0, 4).map((cat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-foreground/60 capitalize">{cat.category}</span>
                      <span className="text-xs text-foreground/40 tabular-nums">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Companion Reflection */}
            <Card className="p-4 bg-primary/5 border-primary/10">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 flex-shrink-0">
                  <CreatureSprite 
                    emotion="happy" 
                    size={48}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-[10px] uppercase tracking-wider text-primary/70">
                      {profile?.companion_name || 'Malunita'}'s Reflection
                    </span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {report.companionMessage}
                  </p>
                </div>
              </div>
            </Card>

            {/* Next Week Prompt */}
            <div className="text-center py-6">
              <p className="text-sm text-foreground/40 mb-3">Ready to start next week strong?</p>
              <Button
                variant="outline"
                onClick={() => {
                  hapticLight();
                  navigate('/today');
                }}
                className="font-mono"
              >
                Plan Tomorrow
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-foreground/40">No data available for this week.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyReview;
