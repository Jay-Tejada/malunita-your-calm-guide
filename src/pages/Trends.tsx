import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Brain, AlertCircle, ArrowLeft, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface LearningTrend {
  id: string;
  analysis_date: string;
  total_corrections_analyzed: number;
  common_patterns: Array<{
    pattern: string;
    frequency: number;
    improvement: string;
  }>;
  top_misunderstood_phrasings: Array<{
    phrase: string;
    count: number;
    context: string;
  }>;
  categorization_improvements: string | null;
  suggestion_improvements: string | null;
}

export default function Trends() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: isCheckingAdmin } = useAdmin();
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);

  const { data: trends, isLoading: isLoadingTrends, refetch } = useQuery({
    queryKey: ['learning-trends'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_trends' as any)
        .select('*')
        .order('analysis_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as unknown as LearningTrend[];
    },
    enabled: isAdmin,
  });

  const handleRunAnalysis = async () => {
    setIsRunningAnalysis(true);
    try {
      const { data, error } = await supabase.functions.invoke('global-trends-analyzer', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: "Analysis complete",
        description: data.message || "Trends analysis has been updated",
      });

      // Refresh the trends data
      await refetch();
    } catch (error: any) {
      console.error('Error running analysis:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to run trends analysis",
        variant: "destructive",
      });
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAdmin && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, isCheckingAdmin, navigate]);

  if (isCheckingAdmin || isLoadingTrends) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const latestTrend = trends?.[0];
  const hasData = trends && trends.length > 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Button>
            </div>
            <h1 className="text-3xl font-light mb-2">AI Learning Trends</h1>
            <p className="text-muted-foreground">
              Insights from user corrections and feedback
            </p>
          </div>
          <div className="flex items-center gap-4">
            {latestTrend && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Last Analysis</p>
                <p className="text-lg font-medium">
                  {new Date(latestTrend.analysis_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <Button
              onClick={handleRunAnalysis}
              disabled={isRunningAnalysis}
              className="gap-2"
            >
              {isRunningAnalysis ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Analysis Now
                </>
              )}
            </Button>
          </div>
        </div>

        {!hasData ? (
          <Card className="p-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-medium mb-2">No trend data yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The AI learning analyzer runs weekly. Once users start providing feedback on task suggestions,
              patterns and improvements will appear here.
            </p>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Corrections Analyzed</p>
                    <p className="text-2xl font-semibold">
                      {latestTrend.total_corrections_analyzed}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Common Patterns</p>
                    <p className="text-2xl font-semibold">
                      {latestTrend.common_patterns?.length || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Misunderstood Phrases</p>
                    <p className="text-2xl font-semibold">
                      {latestTrend.top_misunderstood_phrasings?.length || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Common Patterns */}
            {latestTrend.common_patterns && latestTrend.common_patterns.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Common Correction Patterns
                </h3>
                <div className="space-y-4">
                  {latestTrend.common_patterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="p-4 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="font-medium">{pattern.pattern}</p>
                        <Badge variant="secondary">{pattern.frequency}x</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pattern.improvement}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Misunderstood Phrasings */}
            {latestTrend.top_misunderstood_phrasings && 
             latestTrend.top_misunderstood_phrasings.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Top Misunderstood Phrases
                </h3>
                <div className="space-y-3">
                  {latestTrend.top_misunderstood_phrasings.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="font-medium text-destructive">"{item.phrase}"</p>
                        <Badge variant="outline">{item.count} times</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.context}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Prompt Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {latestTrend.categorization_improvements && (
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">
                    Categorization Improvements
                  </h3>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm whitespace-pre-wrap">
                      {latestTrend.categorization_improvements}
                    </p>
                  </div>
                </Card>
              )}

              {latestTrend.suggestion_improvements && (
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">
                    Suggestion Improvements
                  </h3>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm whitespace-pre-wrap">
                      {latestTrend.suggestion_improvements}
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Historical Trends */}
            {trends.length > 1 && (
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Analysis History</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {trends.map((trend) => (
                    <div
                      key={trend.id}
                      className="flex justify-between items-center p-3 bg-muted/30 rounded-lg text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {new Date(trend.analysis_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-muted-foreground">
                          {trend.total_corrections_analyzed} corrections analyzed
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {trend.common_patterns?.length || 0} patterns
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
