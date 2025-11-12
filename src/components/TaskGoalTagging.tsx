import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const TaskGoalTagging = () => {
  const { tasks } = useTasks();
  const { toast } = useToast();
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());

  // Filter out completed and long-term tasks
  const availableTasks = tasks.filter(t => !t.completed && t.category !== 'long term');
  const untaggedTasks = availableTasks.filter(t => !t.goal_aligned);
  const taggedTasks = availableTasks.filter(t => t.goal_aligned);

  const handleToggleGoalAlignment = async (taskId: string, currentState: boolean) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ goal_aligned: !currentState })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: currentState ? "Removed from goal" : "Added to goal",
        description: currentState 
          ? "Task is no longer goal-aligned" 
          : "Task is now aligned with your goal",
      });
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  if (availableTasks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No active tasks to tag.</p>
            <p className="text-xs mt-2">Create some tasks first to align them with your goal.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Tag Tasks for Goal Alignment
        </CardTitle>
        <CardDescription>
          Select which tasks support your current goal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Already Tagged */}
          {taggedTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Goal-Aligned ({taggedTasks.length})
                </Badge>
              </div>
              <div className="space-y-2">
                {taggedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-primary/5 border-primary/20"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleToggleGoalAlignment(task.id, true)}
                      disabled={updatingTasks.has(task.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.alignment_reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.alignment_reason}
                        </p>
                      )}
                      {task.category && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {task.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Untagged Tasks */}
          {untaggedTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">
                  Untagged ({untaggedTasks.length})
                </Badge>
              </div>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2 pr-4">
                  {untaggedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => handleToggleGoalAlignment(task.id, false)}
                        disabled={updatingTasks.has(task.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.category && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {task.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
