import { Task } from "@/hooks/useTasks";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface TinyTaskFiestaTaskListProps {
  tasks: Task[];
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TinyTaskFiestaTaskList = ({
  tasks,
  completedTaskIds,
  onToggleTask,
}: TinyTaskFiestaTaskListProps) => {
  const completedCount = completedTaskIds.length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="p-6 bg-card border-border/50 shadow-sm space-y-6">
      {/* Header with Progress */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-light font-mono">Tiny Tasks to Complete</h3>
          <div className="text-right">
            <div className="text-2xl font-mono font-light tabular-nums">
              <span className="text-primary">{completedCount}</span>
              <span className="text-muted-foreground"> / {totalCount}</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {completionPercentage}% done
            </p>
          </div>
        </div>
        
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-light">
              No tasks in this fiesta
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = completedTaskIds.includes(task.id);
            return (
              <div
                key={task.id}
                className={`group flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 ${
                  isCompleted 
                    ? 'bg-primary/5 border-primary/20 opacity-60' 
                    : 'bg-background hover:bg-accent/5 border-border/50 hover:border-primary/30'
                }`}
              >
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>
                
                <div className="flex-1 space-y-1 min-w-0">
                  <p className={`font-light leading-relaxed ${
                    isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}>
                    {task.title}
                  </p>
                  {task.context && (
                    <p className="text-sm text-muted-foreground font-light line-clamp-2">
                      {task.context}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Encouragement */}
      {tasks.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          {completedCount === 0 && (
            <p className="text-center text-sm text-muted-foreground font-light">
              Take them one at a time
            </p>
          )}
          {completedCount > 0 && completedCount < totalCount && (
            <p className="text-center text-sm text-muted-foreground font-light">
              {totalCount - completedCount} more to go
            </p>
          )}
          {completedCount === totalCount && totalCount > 0 && (
            <p className="text-center text-sm text-primary font-light">
              All clear! 🎉
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
