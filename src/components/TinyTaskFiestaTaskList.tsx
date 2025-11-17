import { Task } from "@/hooks/useTasks";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
  onDeleteTask,
}: TinyTaskFiestaTaskListProps) => {
  const completedCount = completedTaskIds.length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Your Fiesta Tasks</h3>
        <div className="text-sm">
          <span className="font-bold">{completedCount}</span>
          <span className="text-muted-foreground"> / {totalCount}</span>
          <span className="ml-2 text-muted-foreground">({completionPercentage}%)</span>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No tasks in this fiesta
          </p>
        ) : (
          tasks.map((task) => {
            const isCompleted = completedTaskIds.includes(task.id);
            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  isCompleted 
                    ? 'bg-accent/10 opacity-60' 
                    : 'bg-card hover:bg-accent/5'
                }`}
              >
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => onToggleTask(task.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <p className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                  {task.context && (
                    <p className="text-sm text-muted-foreground">
                      {task.context}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
