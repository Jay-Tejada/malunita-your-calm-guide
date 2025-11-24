import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMonthlyInsights } from '@/hooks/useMonthlyInsights';
import { format, subMonths } from 'date-fns';
import { Sparkles, TrendingUp, AlertCircle, Target, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { CreatureSprite } from '@/components/CreatureSprite';
import { motion } from 'framer-motion';

export const MonthlyInsights = () => {
  const [monthOffset, setMonthOffset] = useState(0);
  const { monthlyData, generatedInsight, isLoadingData, isGenerating, generateInsights } = useMonthlyInsights(monthOffset);

  const currentMonth = format(subMonths(new Date(), monthOffset), 'MMMM yyyy');

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <CreatureSprite size={100} emotion="neutral" className="mx-auto" />
          <p className="text-muted-foreground">Loading your monthly data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthOffset(monthOffset + 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold">{currentMonth}</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))}
            disabled={monthOffset === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={generateInsights}
          disabled={isGenerating || !monthlyData}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating ? 'Analyzing...' : 'Generate Insights'}
        </Button>
      </div>

      {/* Quick Stats */}
      {monthlyData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Tasks Completed</div>
            <div className="text-2xl font-bold">{monthlyData.tasksCompleted}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Joy Average</div>
            <div className="text-2xl font-bold">{monthlyData.emotionalTrends.avgJoy}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Task Streak</div>
            <div className="text-2xl font-bold">{monthlyData.streaks.taskCompletion}d</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Rituals</div>
            <div className="text-2xl font-bold">
              {monthlyData.ritualConsistency.morningCount + monthlyData.ritualConsistency.eveningCount}
            </div>
          </Card>
        </div>
      )}

      {/* AI-Generated Insights */}
      {generatedInsight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Seasonal Insight */}
          {generatedInsight.seasonalInsight && (
            <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-accent-foreground">Seasonal Pattern</h3>
                  <p className="text-base">{generatedInsight.seasonalInsight}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Wins */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <CreatureSprite size={64} emotion="overjoyed" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Your Wins This Month</h3>
                </div>
                <ul className="space-y-2">
                  {generatedInsight.wins.map((win, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Challenges */}
          <Card className="p-6 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <CreatureSprite size={64} emotion="concerned" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <h3 className="text-xl font-semibold">Areas of Overwhelm</h3>
                </div>
                <ul className="space-y-2">
                  {generatedInsight.challenges.map((challenge, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Emerging Habits */}
          <Card className="p-6 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <CreatureSprite size={64} emotion="happy" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-green-500" />
                  <h3 className="text-xl font-semibold">Becoming Reliable Rhythms</h3>
                </div>
                <ul className="space-y-2">
                  {generatedInsight.emergingHabits.map((habit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>{habit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Focus Next */}
          <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <CreatureSprite size={64} emotion="excited" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Focus for Next Month</h3>
                <p className="text-lg">{generatedInsight.focusNext}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Detailed Stats */}
      {monthlyData && !generatedInsight && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Monthly Overview</h3>
          <div className="space-y-6">
            {/* Emotional Trends */}
            <div>
              <h4 className="font-medium mb-3">Emotional Balance</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Joy</span>
                    <span>{monthlyData.emotionalTrends.avgJoy}/100</span>
                  </div>
                  <Progress value={monthlyData.emotionalTrends.avgJoy} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Stress</span>
                    <span>{monthlyData.emotionalTrends.avgStress}/100</span>
                  </div>
                  <Progress value={monthlyData.emotionalTrends.avgStress} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Affection</span>
                    <span>{monthlyData.emotionalTrends.avgAffection}/100</span>
                  </div>
                  <Progress value={monthlyData.emotionalTrends.avgAffection} className="h-2" />
                </div>
              </div>
            </div>

            {/* Top Categories */}
            {monthlyData.topCategories.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Top Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {monthlyData.topCategories.map((cat) => (
                    <Badge key={cat.category} variant="secondary">
                      {cat.category} ({cat.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ritual Consistency */}
            <div>
              <h4 className="font-medium mb-3">Ritual Consistency</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {Math.round((monthlyData.ritualConsistency.morningCount / monthlyData.ritualConsistency.totalDays) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Morning Rituals</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {Math.round((monthlyData.ritualConsistency.eveningCount / monthlyData.ritualConsistency.totalDays) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Evening Reflections</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!generatedInsight && monthlyData && (
        <div className="text-center py-8">
          <CreatureSprite size={100} emotion="curious" className="mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Click "Generate Insights" to get AI-powered analysis of your month
          </p>
        </div>
      )}
    </div>
  );
};
