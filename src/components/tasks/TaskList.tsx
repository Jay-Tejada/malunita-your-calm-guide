import { useState } from "react";
import { Check, MoreVertical } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  completed?: boolean;
  plan_id?: string | null;
}

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  emptyMessage?: string;
  onPlanTask?: (title: string) => void;
}

export const TaskList = ({ 
  tasks, 
  isLoading, 
  emptyMessage = "No tasks",
  onPlanTask 
}: TaskListProps) => {
  const { updateTask } = useTasks();

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

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/40 text-sm font-mono">Loading...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground/40 text-sm font-mono">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
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

          {/* Hover Actions */}
          {onPlanTask && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-muted/30 rounded transition-colors">
                    <MoreVertical className="w-4 h-4 text-foreground/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onPlanTask(task.title)}>
                    Plan This
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
