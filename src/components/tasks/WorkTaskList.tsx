import { Check } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { cn } from "@/lib/utils";

interface WorkTaskListProps {
  showCompleted: boolean;
}

export const WorkTaskList = ({ showCompleted }: WorkTaskListProps) => {
  const { tasks, isLoading, updateTask } = useTasks();
  const { data: projects } = useProjectTasks();

  // Filter work tasks
  const workTasks = tasks?.filter(t => {
    if (showCompleted && t.completed) return t.category === 'work';
    if (!showCompleted && t.completed) return false;
    return t.category === 'work';
  }) || [];

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

  // Group by project
  const tasksWithProjects = workTasks.filter(t => t.plan_id);
  const tasksWithoutProjects = workTasks.filter(t => !t.plan_id);

  // Group tasks by project
  const tasksByProject = tasksWithProjects.reduce((acc, task) => {
    const projectId = task.plan_id!;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {} as Record<string, typeof workTasks>);

  const renderTask = (task: any) => (
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

      {/* Hover Actions - Removed for now */}
    </div>
  );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/30">Loading...</p>
      </div>
    );
  }

  if (workTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/30">No work tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tasks grouped by project */}
      {Object.entries(tasksByProject).map(([projectId, projectTasks]) => {
        const project = projects?.find(p => p.id === projectId);
        return (
          <div key={projectId} className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40 mb-3">
              {project?.title || 'Project'}
            </h3>
            <div className="space-y-1">
              {projectTasks.map(renderTask)}
            </div>
          </div>
        );
      })}

      {/* Ungrouped tasks */}
      {tasksWithoutProjects.length > 0 && (
        <div className="space-y-2">
          {Object.keys(tasksByProject).length > 0 && (
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40 mb-3">
              Ungrouped
            </h3>
          )}
          <div className="space-y-1">
            {tasksWithoutProjects.map(renderTask)}
          </div>
        </div>
      )}
    </div>
  );
};
