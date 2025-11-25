import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemoryEngine } from "@/state/memoryEngine";
import { Brain, TrendingUp, Clock, Heart, Lightbulb, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Learning() {
  const memory = useMemoryEngine();
  const { toast } = useToast();
  const [recentCorrections, setRecentCorrections] = useState<any[]>([]);

  useEffect(() => {
    loadRecentCorrections();
  }, []);

  const loadRecentCorrections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('ai_corrections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setRecentCorrections(data);
  };

  const handleManualSync = async () => {
    try {
      await memory.syncWithBackend();
      toast({
        title: "Synced!",
        description: "Your learning profile has been saved.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Could not sync your profile. Try again.",
        variant: "destructive",
      });
    }
  };

  const topCategories = Object.entries(memory.categoryPreferences)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const energyTimes = [
    { label: "Morning", value: memory.energyPattern.morning, icon: "🌅" },
    { label: "Afternoon", value: memory.energyPattern.afternoon, icon: "☀️" },
    { label: "Night", value: memory.energyPattern.night, icon: "🌙" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-foreground flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" />
              Learning Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              What Malunita has learned about you
            </p>
          </div>
          <Button onClick={handleManualSync} variant="outline">
            Sync Now
          </Button>
        </div>

        {/* Writing Style */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Writing Style
            </CardTitle>
            <CardDescription>How you express yourself</CardDescription>
          </CardHeader>
          <CardContent>
            {memory.writingStyle ? (
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {memory.writingStyle}
              </Badge>
            ) : (
              <p className="text-muted-foreground">
                Not enough data yet. Keep using the app!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Category Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Category Preferences
            </CardTitle>
            <CardDescription>Your most frequent task types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategories.length > 0 ? (
              topCategories.map(([category, weight]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{category}</span>
                    <span className="text-muted-foreground">
                      {Math.round(weight * 100)}%
                    </span>
                  </div>
                  <Progress value={weight * 100} className="h-2" />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                Complete more tasks to see your preferences
              </p>
            )}
          </CardContent>
        </Card>

        {/* Priority Bias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Priority Bias
            </CardTitle>
            <CardDescription>How you prioritize tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(memory.priorityBias).map(([priority, weight]) => (
              <div key={priority} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="uppercase font-medium">{priority}</span>
                  <span className="text-muted-foreground">
                    {Math.round(weight * 100)}%
                  </span>
                </div>
                <Progress value={weight * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Energy Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Energy Usage
            </CardTitle>
            <CardDescription>When you're most productive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {energyTimes.map(({ label, value, icon }) => (
              <div key={label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{icon}</span>
                    {label}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(value * 100)}%
                  </span>
                </div>
                <Progress value={value * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Emotional Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Emotional Patterns
            </CardTitle>
            <CardDescription>What affects your motivation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Procrastination Triggers</h4>
              <div className="flex flex-wrap gap-2">
                {memory.procrastinationTriggers.length > 0 ? (
                  memory.procrastinationTriggers.map((trigger, i) => (
                    <Badge key={i} variant="destructive">
                      {trigger}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">None identified yet</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Positive Reinforcers</h4>
              <div className="flex flex-wrap gap-2">
                {memory.positiveReinforcers.length > 0 ? (
                  memory.positiveReinforcers.slice(0, 10).map((reinforcer, i) => (
                    <Badge key={i} variant="secondary">
                      {reinforcer}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">None identified yet</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Emotional Triggers</h4>
              <div className="flex flex-wrap gap-2">
                {memory.emotionalTriggers.length > 0 ? (
                  memory.emotionalTriggers.map((trigger, i) => (
                    <Badge key={i} variant="outline">
                      {trigger}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">None identified yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tiny Task Threshold */}
        <Card>
          <CardHeader>
            <CardTitle>Tiny Task Detection</CardTitle>
            <CardDescription>Tasks shorter than this are classified as tiny</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light">
              {memory.tinyTaskThreshold} characters
            </div>
          </CardContent>
        </Card>

        {/* Recent Corrections */}
        <Card>
          <CardHeader>
            <CardTitle>Help Malunita Learn Faster</CardTitle>
            <CardDescription>Recent corrections you've made</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCorrections.length > 0 ? (
              <div className="space-y-2">
                {recentCorrections.map((correction) => (
                  <div
                    key={correction.id}
                    className="p-3 bg-muted/30 rounded-lg text-sm"
                  >
                    <div className="font-medium">{correction.task_title}</div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {new Date(correction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No corrections yet. When you edit AI suggestions, they help Malunita learn!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Insights Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>What Malunita Knows</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                You prefer <strong>{memory.writingStyle || "a balanced"}</strong> communication style
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                Your top category is <strong>{topCategories[0]?.[0] || "not yet determined"}</strong>
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                You're most productive in the{" "}
                <strong>
                  {energyTimes.reduce((max, time) => 
                    time.value > max.value ? time : max
                  ).label.toLowerCase()}
                </strong>
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                {memory.streakHistory.length} days of learning data collected
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
