import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, User, Clock, Bell } from "lucide-react";
import { useTasks, Task } from "@/hooks/useTasks";

export const TaskList = () => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p>No tasks yet. Start by speaking into Malunita.</p>
      </Card>
    );
  }

  const handleToggleComplete = (task: Task) => {
    updateTask({
      id: task.id,
      updates: {
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className={`p-4 transition-all hover:shadow-md ${
            task.completed ? 'opacity-60 bg-muted/30' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => handleToggleComplete(task)}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <h3
                className={`font-medium ${
                  task.completed ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {task.title}
              </h3>
              
              {task.context && (
                <p className="text-sm text-muted-foreground mt-1">{task.context}</p>
              )}
              
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {task.has_person_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Person
                  </span>
                )}
                {task.is_time_based && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Scheduled
                  </span>
                )}
                {task.has_reminder && (
                  <span className="flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    Reminder
                  </span>
                )}
                {task.keywords && task.keywords.length > 0 && (
                  <span className="flex items-center gap-1">
                    {task.keywords.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(task.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
