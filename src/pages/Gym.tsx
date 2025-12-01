import { useState, KeyboardEvent } from "react";
import { SimpleHeader } from "@/components/SimpleHeader";
import { ArrowRight, Check, MoreVertical, ChevronDown, ChevronUp } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Gym = () => {
  const { tasks, isLoading, createTasks, updateTask } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const [quickInput, setQuickInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();
  const { toast } = useToast();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  const handleCapture = async () => {
    if (!quickInput.trim()) return;
    
    try {
      await createTasks([{
        title: quickInput.trim(),
        category: 'gym',
      }]);
      
      setQuickInput("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        description: "Failed to capture",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleQuickCapture = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleCapture();
    }
  };

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

  // Get gym tasks
  const gymTasks = tasks?.filter(t => {
    if (showCompleted && t.completed) return t.category === 'gym';
    if (!showCompleted && t.completed) return false;
    return t.category === 'gym';
  }) || [];

  const completedCount = gymTasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <SimpleHeader title="Gym" />
      </div>
      
      {/* Planning Mode Overlay */}
      {planningMode && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <PlanningModePanel 
            initialText={planningText}
            loading={loading}
            error={error}
            result={result}
            onRun={() => runPlanningBreakdown(planningText)}
            onClose={() => setPlanningMode(false)} 
          />
        </div>
      )}
      
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20 md:pb-6">
        {/* Quick capture input */}
        <div className="mb-6 relative">
          <div className="relative">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={handleQuickCapture}
              placeholder="Add a fitness task..."
              className={cn(
                "w-full bg-transparent border-0 border-b transition-all font-mono text-sm py-2 pr-8 px-0 placeholder:text-muted-foreground/40 outline-none",
                showSuccess 
                  ? "border-primary/50" 
                  : "border-border/30 focus:border-foreground/40"
              )}
            />
            
            {/* Send indicator */}
            {quickInput.trim() && !showSuccess && (
              <button
                onClick={handleCapture}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/50 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            
            {/* Success checkmark */}
            {showSuccess && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary animate-scale-in">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
          
          {/* Hint text */}
          {!quickInput.trim() && !showSuccess && (
            <p className="text-[10px] text-muted-foreground/30 mt-1 font-mono">
              Press enter to capture
            </p>
          )}
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground/40 text-sm font-mono">Loading...</p>
          </div>
        ) : gymTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground/40 text-sm font-mono">No fitness tasks</p>
          </div>
        ) : (
          <div className="space-y-1">
            {gymTasks.map((task) => (
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
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-muted/30 rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-foreground/40" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handlePlanThis(task.title)}>
                        Plan This
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show Completed Toggle */}
        {completedCount > 0 && (
          <div className="mt-8 pt-6 border-t border-border/20">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCompleted ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span>
                {showCompleted ? 'Hide' : 'Show'} completed ({completedCount})
              </span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Gym;
