import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function AllTasks() {
  const { tasks, updateTask } = useTasks();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "work" | "home" | "gym">("all");

  const incompleteTasks = tasks?.filter(t => !t.completed) || [];
  const filteredTasks = filter === "all" 
    ? incompleteTasks 
    : incompleteTasks.filter(t => t.category === filter);

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
          <div className="flex-1">
            <h1 className="text-2xl font-medium font-mono">All Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Complete task inventory
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 flex-wrap">
          {["all", "work", "home", "gym"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat as typeof filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs border transition-all",
                filter === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border hover:bg-muted hover:border-input"
              )}
            >
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No tasks found</p>
              <p className="text-xs mt-1">Add some tasks to get started</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
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
