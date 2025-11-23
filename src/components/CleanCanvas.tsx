import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mic } from "lucide-react";

interface CleanCanvasProps {
  onVoiceInput?: () => void;
  onShowBillboard?: () => void;
}

export function CleanCanvas({ onVoiceInput, onShowBillboard }: CleanCanvasProps) {
  const { tasks, createTasks, updateTask } = useTasks();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [taskInput, setTaskInput] = useState("");

  // Get today's tasks (up to 5)
  const todayTasks = (tasks || [])
    .filter(t => !t.completed)
    .slice(0, 5);

  const handleAddTask = async () => {
    if (!taskInput.trim()) return;
    
    try {
      await createTasks([{
        title: taskInput,
        category: "inbox",
      }]);
      setTaskInput("");
      toast({
        title: "Task added",
        description: "Your task has been captured",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const handleTaskComplete = async (id: string) => {
    const task = tasks?.find(t => t.id === id);
    if (task) {
      await updateTask({
        id,
        updates: {
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null,
        },
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      
      {/* Central Input */}
      <div className="flex items-center gap-2 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="Type a thought or task, or talk to Malunita…"
            className="h-14 text-base pr-12 rounded-xl border-border/50 focus:border-primary/50"
          />
          <Button
            onClick={onShowBillboard}
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </Button>
        </div>
        {onVoiceInput && (
          <Button
            onClick={onVoiceInput}
            size="lg"
            variant="outline"
            className="h-14 px-4 rounded-xl"
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Today's Tasks Preview */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">Today</h2>
          {todayTasks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/inbox")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Button>
          )}
        </div>

        {todayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No tasks for today yet. Capture the first one above.
          </p>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={() => handleTaskComplete(task.id)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
