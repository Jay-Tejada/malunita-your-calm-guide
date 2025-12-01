import { Check } from "lucide-react";
import { useTasks, Task } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

interface TodayTaskListProps {
  showCompleted: boolean;
}

export const TodayTaskList = ({ showCompleted }: TodayTaskListProps) => {
  const { tasks, isLoading, updateTask } = useTasks();

  const todayDate = new Date().toISOString().split('T')[0];

  // Get today's tasks
  const todayTasks = tasks?.filter(t => {
    if (showCompleted && t.completed) return true;
    if (!showCompleted && t.completed) return false;
    return t.scheduled_bucket === 'today' || t.focus_date === todayDate;
  }) || [];

  // Group by priority
  const mustTasks = todayTasks.filter(t => t.ai_metadata?.priority === 'MUST' || t.priority === 'MUST');
  const shouldTasks = todayTasks.filter(t => t.ai_metadata?.priority === 'SHOULD' || t.priority === 'SHOULD');
  const couldTasks = todayTasks.filter(t => t.ai_metadata?.priority === 'COULD' || t.priority === 'COULD');
  const otherTasks = todayTasks.filter(t => !t.ai_metadata?.priority && !t.priority);

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await updateTask({
        id: taskId,
        updates: {
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null,
        }
      });
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const renderTaskGroup = (tasks: Task[], label?: string) => {
    if (tasks.length === 0) return null;

    return (
      <div className="space-y-2">
        {label && (
          <div className="h-px bg-border/20 my-4" />
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 py-2.5 px-3 hover:bg-muted/20 rounded-md transition-colors group"
          >
            <button
              onClick={() => handleToggleTask(task.id, task.completed || false)}
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all",
                task.completed
                  ? "bg-foreground/10 border border-foreground/20"
                  : "bg-transparent border border-foreground/20 hover:border-foreground/40"
              )}
            >
              {task.completed && (
                <Check className="w-3 h-3 text-foreground/60" />
              )}
            </button>
            <span className={cn(
              "flex-1 font-mono text-[14px] leading-snug",
              task.completed ? "text-foreground/40 line-through" : "text-foreground/90"
            )}>
              {task.title}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40 mb-4">
        Today's Tasks
      </h3>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground/40 text-sm">Loading...</p>
        </div>
      ) : todayTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground/40 text-sm">No tasks scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-1">
          {renderTaskGroup(mustTasks)}
          {renderTaskGroup(shouldTasks, shouldTasks.length > 0 && mustTasks.length > 0 ? 'should' : undefined)}
          {renderTaskGroup(couldTasks, couldTasks.length > 0 && (mustTasks.length > 0 || shouldTasks.length > 0) ? 'could' : undefined)}
          {renderTaskGroup(otherTasks, otherTasks.length > 0 && (mustTasks.length > 0 || shouldTasks.length > 0 || couldTasks.length > 0) ? 'other' : undefined)}
        </div>
      )}
    </div>
  );
};
