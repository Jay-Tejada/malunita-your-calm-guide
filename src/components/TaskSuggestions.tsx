import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  time?: string;
  context: string;
  completed: boolean;
}

interface TaskSuggestion {
  title: string;
  priority: 'low' | 'medium' | 'high';
  category: 'inbox' | 'home' | 'work' | 'gym' | 'projects';
  context: string;
  suggestion_type?: 'breakdown' | 'related' | 'followup' | 'scheduled' | 'standard';
  parent_task_title?: string;
  suggested_due_date?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  related_keywords?: string[];
  contextual_note?: string;
}

interface TaskSuggestionsProps {
  tasks: Task[];
  domain: string;
  onAddTask: (title: string, context: string, category: string) => void;
}

export const TaskSuggestions = ({ tasks, domain, onAddTask }: TaskSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if in burnout recovery mode
      const { data: profile } = await supabase
        .from('profiles')
        .select('burnout_recovery_until')
        .eq('id', user?.id || '')
        .maybeSingle();

      const burnoutRecovery = profile?.burnout_recovery_until 
        ? new Date(profile.burnout_recovery_until) > new Date()
        : false;
      
      const { data, error } = await supabase.functions.invoke('suggest-tasks', {
        body: { 
          tasks, 
          domain,
          userId: user?.id,
          burnoutRecovery,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setSuggestions(data.suggestions);
      setIsExpanded(true);
      toast({
        title: "Suggestions ready!",
        description: `Malunita generated ${data.suggestions.length} task suggestions`,
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuggestion = (suggestion: TaskSuggestion) => {
    onAddTask(suggestion.title, suggestion.context, suggestion.category);
    setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
    toast({
      title: "Task added",
      description: suggestion.title,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSuggestionTypeLabel = (type?: string) => {
    switch (type) {
      case 'breakdown': return '🔨 Task Breakdown';
      case 'related': return '🔗 Related Task';
      case 'followup': return '⏭️ Follow-up';
      case 'scheduled': return '📅 Scheduled';
      default: return '✨ Suggested';
    }
  };

  const getSuggestionTypeColor = (type?: string) => {
    switch (type) {
      case 'breakdown': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'related': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'followup': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'scheduled': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-accent/10 text-accent border-accent/20';
    }
  };

  // Group suggestions by type for better organization
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const type = suggestion.suggestion_type || 'standard';
    if (!acc[type]) acc[type] = [];
    acc[type].push(suggestion);
    return acc;
  }, {} as Record<string, TaskSuggestion[]>);

  const suggestionOrder = ['breakdown', 'scheduled', 'followup', 'related', 'standard'];

  return (
    <div className="mb-8">
      {!isExpanded ? (
        <Button
          onClick={generateSuggestions}
          disabled={isLoading}
          variant="outline"
          className="w-full gap-2 border-accent/50 hover:border-accent"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Malunita is thinking...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Get AI Task Suggestions
            </>
          )}
        </Button>
      ) : (
        <Card className="p-6 bg-accent/10 border-accent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-normal text-foreground">Suggested Tasks</h3>
            </div>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
            >
              Hide
            </Button>
          </div>

          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              All suggestions have been added or dismissed
            </p>
          ) : (
            <div className="space-y-4">
              {suggestionOrder.map(type => {
                const typeSuggestions = groupedSuggestions[type];
                if (!typeSuggestions || typeSuggestions.length === 0) return null;

                return (
                  <div key={type} className="space-y-3">
                    {typeSuggestions.map((suggestion, index) => (
                      <Card
                        key={`${type}-${index}`}
                        className="p-4 bg-card border-secondary hover:border-accent transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getSuggestionTypeColor(suggestion.suggestion_type)}>
                                {getSuggestionTypeLabel(suggestion.suggestion_type)}
                              </Badge>
                              <Badge variant={getPriorityColor(suggestion.priority)}>
                                {suggestion.priority}
                              </Badge>
                              {suggestion.category !== domain && (
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.category}
                                </Badge>
                              )}
                              {suggestion.is_recurring && (
                                <Badge variant="outline" className="text-xs">
                                  🔄 {suggestion.recurrence_pattern}
                                </Badge>
                              )}
                              {suggestion.suggested_due_date && (
                                <Badge variant="outline" className="text-xs">
                                  📅 {new Date(suggestion.suggested_due_date).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                            
                            {suggestion.parent_task_title && (
                              <p className="text-xs text-muted-foreground">
                                ↳ From: {suggestion.parent_task_title}
                              </p>
                            )}
                            
                            <p className="text-sm font-medium text-foreground">
                              {suggestion.title}
                            </p>
                            
                            {suggestion.contextual_note && (
                              <p className="text-xs text-muted-foreground italic">
                                📝 {suggestion.contextual_note}
                              </p>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              {suggestion.context}
                            </p>
                            
                            {suggestion.related_keywords && suggestion.related_keywords.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs text-muted-foreground">Related to:</span>
                                {suggestion.related_keywords.map((keyword, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => handleAddSuggestion(suggestion)}
                            size="sm"
                            variant="ghost"
                            className="shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <Button
            onClick={generateSuggestions}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full mt-4 gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Refresh Suggestions
              </>
            )}
          </Button>
        </Card>
      )}
    </div>
  );
};
