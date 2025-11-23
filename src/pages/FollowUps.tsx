import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FollowUps() {
  const { tasks, updateTask } = useTasks();
  const navigate = useNavigate();

  const followUps = tasks?.filter(t => !t.completed && t.has_reminder) || [];

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
            <h1 className="text-2xl font-medium font-mono">Follow Ups</h1>
            <p className="text-sm text-muted-foreground">
              Tasks that need your attention
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {followUps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No follow ups</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            followUps.map((task) => (
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
