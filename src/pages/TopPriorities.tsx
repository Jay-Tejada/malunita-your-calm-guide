import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TopPriorities() {
  const { tasks, updateTask } = useTasks();
  const navigate = useNavigate();

  const topPriorities = tasks?.filter(t => !t.completed && t.is_focus) || [];

  const handleTaskComplete = (id: string) => {
    const task = tasks?.find(t => t.id === id);
    if (!task) return;

    updateTask({
      id,
      updates: {
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-medium font-mono">Top Priorities</h1>
            <p className="text-sm text-muted-foreground">
              Your most important tasks
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {topPriorities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No priorities set</p>
              <p className="text-xs mt-1">Mark tasks as priorities from your task list</p>
            </div>
          ) : (
            topPriorities.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.title}
                context={task.context || undefined}
                completed={task.completed || false}
                onToggle={() => handleTaskComplete(task.id)}
                goalAligned={task.goal_aligned}
                alignmentReason={task.alignment_reason}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
