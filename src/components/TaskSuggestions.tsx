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
      const { data, error } = await supabase.functions.invoke('suggest-tasks', {
        body: { tasks, domain }
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
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="p-4 bg-card border-secondary hover:border-accent transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority}
                        </Badge>
                        {suggestion.category !== domain && (
                          <Badge variant="outline" className="text-xs">
                            {suggestion.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.context}
                      </p>
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
