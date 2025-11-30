import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

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
  onDeleteTask 
}: TinyTaskFiestaTaskListProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks to Complete</CardTitle>
          <Badge variant="secondary">
            {completedTaskIds.length} / {tasks.length}
          </Badge>
        </div>
        <Progress value={50} className="h-1 mt-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <Checkbox 
                id={task.id}
                checked={completedTaskIds.includes(task.id)}
              />
              <label 
                htmlFor={task.id} 
                className="flex-1 text-sm font-mono cursor-pointer"
              >
                {task.title}
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Encouragement */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            Keep the momentum going! 🎉
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
