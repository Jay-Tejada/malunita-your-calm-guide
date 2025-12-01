import { useState } from "react";
import { SimpleHeader } from "@/components/SimpleHeader";
import { useTasks } from "@/hooks/useTasks";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";
import { Check, MoreVertical, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Someday = () => {
  const { tasks, isLoading, updateTask } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();
  const { toast } = useToast();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  // Get someday tasks, sorted by newest first
  const somedayTasks = tasks?.filter(t => 
    !t.completed && t.scheduled_bucket === 'someday'
  ).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) || [];

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

  const handleMoveToToday = async (taskId: string) => {
    try {
      await updateTask({
        id: taskId,
        updates: {
          scheduled_bucket: 'today',
        }
      });
      
      toast({
        description: "Moved to Today",
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to move task:", error);
      toast({
        description: "Failed to move task",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <SimpleHeader title="Someday" />
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
        {/* Intro Text */}
        <div className="mb-8 text-center">
          <p className="text-sm text-muted-foreground/50 font-mono">
            Ideas worth keeping, for when the time is right.
          </p>
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground/40 text-sm font-mono">Loading...</p>
          </div>
        ) : somedayTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground/40 text-sm font-mono">Nothing here yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {somedayTasks.map((task) => (
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
                      <DropdownMenuItem onClick={() => handleMoveToToday(task.id)}>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Move to Today
                      </DropdownMenuItem>
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
      </main>
    </div>
  );
};

export default Someday;
