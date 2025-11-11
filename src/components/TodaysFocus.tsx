import { useTasks, Task } from "@/hooks/useTasks";
import { FocusCard } from "@/components/FocusCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const TodaysFocus = () => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();

  const today = new Date().toISOString().split('T')[0];
  const focusTasks = tasks?.filter(task => 
    task.is_focus && 
    task.focus_date === today &&
    !task.completed
  ) || [];

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-light text-foreground">Today's Focus</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {focusTasks.length === 0 
              ? "What are the 3-5 most important things today?" 
              : `${focusTasks.length} task${focusTasks.length > 1 ? 's' : ''} to focus on`}
          </p>
        </div>
        {focusTasks.length === 0 && (
          <Button variant="ghost" size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Suggest Tasks
          </Button>
        )}
      </div>

      {focusTasks.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-3">
            <p className="text-muted-foreground">
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
