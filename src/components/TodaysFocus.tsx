import React from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { FocusCard } from "@/components/FocusCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface TodaysFocusProps {
  onReflectClick?: () => void;
}

export const TodaysFocus = ({ onReflectClick }: TodaysFocusProps) => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  const { profile } = useProfile();
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const focusTasks = tasks?.filter(task => 
    task.is_focus && 
    task.focus_date === today &&
    !task.completed
  ) || [];

  const pendingTasks = tasks?.filter(task => !task.completed && !task.is_focus) || [];

  const handleToggleComplete = (task: Task) => {
    updateTask({
      id: task.id,
      updates: {
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      },
    });
  };

  const handleRemoveFromFocus = (taskId: string) => {
    updateTask({
      id: taskId,
      updates: {
        is_focus: false,
        focus_date: null,
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
  };

  const handleSuggestFocus = async () => {
    if (pendingTasks.length === 0) {
      toast({
        title: "No tasks to suggest",
        description: "Add some tasks first, then I can help you prioritize.",
      });
      return;
    }

    setIsSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-focus', {
        body: { 
          tasks: pendingTasks.map(t => ({
            id: t.id,
            title: t.title,
            context: t.context,
            category: t.category,
            has_reminder: t.has_reminder,
            is_time_based: t.is_time_based
          })),
          userProfile: profile
        }
      });

      if (error) throw error;

      const { suggestions, message } = data;
      
      // Apply suggestions to tasks
      const today = new Date().toISOString().split('T')[0];
      for (const suggestion of suggestions) {
        const task = pendingTasks[suggestion.taskIndex];
        if (task) {
          await updateTask({
            id: task.id,
            updates: {
              is_focus: true,
              focus_date: today,
              context: suggestion.reason
            }
          });
        }
      }

      toast({
        title: "Focus tasks suggested",
        description: message || `I've picked ${suggestions.length} tasks to focus on today.`,
      });
    } catch (error: any) {
      console.error('Error suggesting focus:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-card animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-light text-foreground">Today's Focus</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {focusTasks.length === 0 
              ? "What are the 3-5 most important things today?" 
              : `${focusTasks.length} task${focusTasks.length > 1 ? 's' : ''} to focus on`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onReflectClick && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={onReflectClick}
              title="Review the week with Malunita"
            >
              🪞 Reflect
            </Button>
          )}
          {focusTasks.length === 0 && pendingTasks.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={handleSuggestFocus}
              disabled={isSuggesting}
            >
              <Sparkles className="w-4 h-4" />
              {isSuggesting ? 'Thinking...' : 'Suggest Tasks'}
            </Button>
          )}
        </div>
      </div>

      {focusTasks.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-2 sm:space-y-3">
            <p className="text-sm sm:text-base text-muted-foreground">
              Your focus area is clear and ready.
            </p>
            <p className="text-sm text-muted-foreground">
              Add tasks from Inbox, or let Malunita help you identify what matters most today.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {focusTasks.map((task) => (
            <FocusCard
              key={task.id}
              task={task}
              onToggle={() => handleToggleComplete(task)}
              onDelete={() => handleDelete(task.id)}
              onRemoveFromFocus={() => handleRemoveFromFocus(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
