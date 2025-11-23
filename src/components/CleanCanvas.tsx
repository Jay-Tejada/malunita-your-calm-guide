import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/TaskCard";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type CanvasMode = "morning" | "working" | "overloaded";

interface CleanCanvasProps {
  onVoiceInput?: () => void;
}

export function CleanCanvas({ onVoiceInput }: CleanCanvasProps) {
  const { tasks, updateTask, createTasks } = useTasks();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [taskInput, setTaskInput] = useState("");

  // Determine canvas mode
  const incompleteTasks = tasks?.filter(t => !t.completed) || [];
  const taskCount = incompleteTasks.length;
  
  let canvasMode: CanvasMode = "working";
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11 && taskCount === 0) {
    canvasMode = "morning";
  } else if (taskCount > 30) {
    canvasMode = "overloaded";
  }

  // Curated task slices
  const topPriorities = incompleteTasks.filter(t => t.is_focus).slice(0, 2);
  const quickWins = incompleteTasks
    .filter(t => !t.is_focus && !t.has_reminder)
    .slice(0, 2);
  const followUps = incompleteTasks
    .filter(t => !t.is_focus && t.has_reminder)
    .slice(0, 1);

  const handleAddTask = async () => {
    if (!taskInput.trim()) return;

    await createTasks([{
      title: taskInput.trim(),
      category: "inbox",
      input_method: "text",
    }]);

    setTaskInput("");
    toast({
      title: "Task added",
      description: taskInput.trim(),
    });
  };

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
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      {/* Morning State */}
      {canvasMode === "morning" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 py-12"
        >
          <div className="space-y-3">
            <h2 className="text-3xl font-medium font-mono text-foreground">
              Good morning ☀️
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              What's on your mind today?
            </p>
          </div>
          <Button
            onClick={() => navigate("/daily-session")}
            variant="outline"
            className="group"
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
            Want help choosing 3 priorities?
          </Button>
        </motion.div>
      )}

      {/* Overloaded State */}
      {canvasMode === "overloaded" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-[10px] p-4 flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Feeling overloaded?
            </p>
            <p className="text-xs text-muted-foreground">
              You have {taskCount} tasks. Want to focus on just 5?
            </p>
          </div>
          <Button
            onClick={() => navigate("/focus")}
            size="sm"
            variant="default"
          >
            Focus Mode
          </Button>
        </motion.div>
      )}

      {/* Working State - Curated Tasks */}
      {canvasMode === "working" && (
        <div className="space-y-6">
          {/* Top Priorities */}
          {topPriorities.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Top Priorities
                </h3>
                <button
                  onClick={() => navigate("/top-priorities")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {topPriorities.map((task) => (
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
                ))}
              </div>
            </section>
          )}

          {/* Quick Wins */}
          {quickWins.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Quick Wins
                </h3>
                <button
                  onClick={() => navigate("/quick-wins")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {quickWins.map((task) => (
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
                ))}
              </div>
            </section>
          )}

          {/* Follow Ups */}
          {followUps.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Follow Ups
                </h3>
                <button
                  onClick={() => navigate("/follow-ups")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {followUps.map((task) => (
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
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Central Input Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-card border border-input rounded-[10px] px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all focus-within:border-primary focus-within:shadow-md">
          <span className="text-muted-foreground text-xl">+</span>
          <input
            type="text"
            placeholder="Type a task or talk to Malunita…"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTask();
            }}
            className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={onVoiceInput}
            className="shrink-0"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
