import { Card } from '@/components/ui/card';
import { useFocusTrends } from '@/hooks/useFocusTrends';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Line, ComposedChart, Cell } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';

export const FocusTrends = () => {
  const { data, isLoading } = useFocusTrends();

  if (isLoading) {
    return (
      <Card className="p-6 bg-card border-border/40">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-muted rounded mb-4" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  // Convert trends to chart data
  const chartData = data.trends.map((trend, index) => ({
    day: trend.date,
    done: trend.outcome === 'done' ? 1 : 0,
    partial: trend.outcome === 'partial' ? 1 : 0,
    missed: trend.outcome === 'missed' ? 1 : 0,
    hasData: trend.outcome !== null,
    // Streak line value (only show if consecutive done)
    streak: data.trends.slice(0, index + 1).every(t => t.outcome === 'done' || t.outcome === null) 
      ? data.trends.slice(0, index + 1).filter(t => t.outcome === 'done').length 
      : 0,
  }));

  const getBarColor = (entry: any) => {
    if (entry.done) return 'hsl(var(--success))';
    if (entry.partial) return 'hsl(var(--accent))';
    if (entry.missed) return 'hsl(var(--muted))';
    return 'hsl(var(--border))';
  };

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-light text-muted-foreground">Focus Trends</h3>
      </div>
      
      <ChartContainer
        config={{
          done: {
            label: "Done",
            color: "hsl(var(--success))",
          },
          partial: {
            label: "Partial",
            color: "hsl(var(--accent))",
          },
          missed: {
            label: "Missed",
            color: "hsl(var(--muted))",
          },
          streak: {
            label: "Streak",
            color: "hsl(var(--foreground))",
          },
        }}
        className="h-48"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <XAxis 
              dataKey="day" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide domain={[0, 7]} />
            <Bar 
              dataKey={(entry) => entry.done || entry.partial || entry.missed || (entry.hasData ? 0 : 0.1)} 
              radius={[8, 8, 0, 0]}
              maxBarSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry)}
                  opacity={entry.hasData ? 1 : 0.3}
                />
              ))}
            </Bar>
            {data.currentStreak > 0 && (
              <Line 
                type="monotone" 
                dataKey="streak" 
                stroke="hsl(var(--foreground))"
                strokeWidth={1.5}
                dot={false}
                opacity={0.4}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span>Missed</span>
          </div>
        </div>
        {data.currentStreak > 0 && (
          <span className="font-light">Current streak: {data.currentStreak} days</span>
        )}
      </div>
    </Card>
  );
};
