import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Clock, BarChart3 } from "lucide-react";

export const PersonalizationInsights = () => {
  const { profile } = useProfile();

  // @ts-ignore - insights field exists after migration
  const insights = profile?.insights as any;
  // @ts-ignore - preferences_summary field exists after migration
  const preferencesSummary = profile?.preferences_summary;

  if (!insights || !preferencesSummary) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-medium">Your Personalized Insights</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {preferencesSummary}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Categories */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="w-4 h-4" />
            <span>Top Categories</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.topCategories?.map((cat: any, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {cat.category} ({cat.percentage}%)
              </Badge>
            ))}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Completion Rate</span>
          </div>
          <p className="text-2xl font-light">{insights.completionRate}%</p>
          <p className="text-xs text-muted-foreground">
            {insights.avgTasksPerDay} tasks/day avg
          </p>
        </div>

        {/* Preferred Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>Best Time</span>
          </div>
          <p className="text-lg font-light capitalize">
            {insights.preferredInputTime}
          </p>
          <p className="text-xs text-muted-foreground">
            {insights.voiceVsTextRatio?.voice}% voice input
          </p>
        </div>
      </div>

      {insights.lastAnalyzed && (
        <p className="text-xs text-muted-foreground mt-4">
          Last updated: {new Date(insights.lastAnalyzed).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
};