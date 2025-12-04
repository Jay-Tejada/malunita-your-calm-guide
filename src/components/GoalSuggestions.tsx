import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GoalSuggestion {
  goal: string;
  timeframe: 'this_week' | 'this_month' | 'this_quarter';
  reasoning: string;
  category: string;
}

interface GoalSuggestionsProps {
  onSelectGoal: (goal: string, timeframe: string) => void;
}

export const GoalSuggestions = ({ onSelectGoal }: GoalSuggestionsProps) => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      // DEPRECATED: suggest-goals consolidated to suggest-focus in Phase 3B
      // TODO: Migrate to suggest-focus with goal mode
      const { data, error } = await supabase.functions.invoke('suggest-focus', {
        body: { includeGoalSuggestions: true },
      });

      if (error) {
        if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again in a few moments.');
        }
        if (error.message.includes('402')) {
          throw new Error('AI usage limit reached. Please add credits to continue.');
        }
        throw error;
      }

      setSuggestions(data.suggestions || []);
      setHasLoaded(true);
    } catch (error: any) {
      console.error('Error loading suggestions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load goal suggestions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case 'this_week': return 'This Week';
      case 'this_month': return 'This Month';
      case 'this_quarter': return 'This Quarter';
      default: return timeframe;
    }
  };

  if (!hasLoaded) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Need goal inspiration?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Get AI-powered suggestions based on your task history and patterns
            </p>
            <Button
              onClick={loadSuggestions}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your tasks...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4" />
                  Get Goal Suggestions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI-Powered Goal Suggestions
            </CardTitle>
            <CardDescription>
              Personalized recommendations based on your activity
            </CardDescription>
          </div>
          <Button
            onClick={loadSuggestions}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No suggestions available yet.</p>
            <p className="text-xs mt-2">Create more tasks to get better recommendations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {getTimeframeLabel(suggestion.timeframe)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm mb-2">{suggestion.goal}</h4>
                    <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                  </div>
                  <Button
                    onClick={() => onSelectGoal(suggestion.goal, suggestion.timeframe)}
                    size="sm"
                    variant="ghost"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
