import { useState } from "react";
import { SimpleHeader } from "@/components/SimpleHeader";
import { useTasks } from "@/hooks/useTasks";
import { useDailyIntelligence } from "@/hooks/useDailyIntelligence";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Today = () => {
  const { tasks, isLoading, updateTask, createTasks } = useTasks();
  const { data: intelligence } = useDailyIntelligence();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const [oneThingInput, setOneThingInput] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();
  const { toast } = useToast();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  // Get today's date formatted
  const todayFormatted = format(new Date(), "EEEE, MMMM d");
  const todayDate = new Date().toISOString().split('T')[0];

  // Find the ONE thing (focus task for today)
  const oneThing = tasks?.find(t => t.is_focus && t.focus_date === todayDate && !t.completed);

  // Get today's tasks (scheduled_bucket = 'today' or tasks with focus_date = today)
  const todayTasks = tasks?.filter(t => {
    if (showCompleted && t.completed) return true;
    if (!showCompleted && t.completed) return false;
    return t.scheduled_bucket === 'today' || t.focus_date === todayDate;
  }) || [];

  // Group by priority
  const mustTasks = todayTasks.filter(t => t.ai_metadata?.priority === 'MUST' || t.priority === 'MUST');
  const shouldTasks = todayTasks.filter(t => t.ai_metadata?.priority === 'SHOULD' || t.priority === 'SHOULD');
  const couldTasks = todayTasks.filter(t => t.ai_metadata?.priority === 'COULD' || t.priority === 'COULD');
  const otherTasks = todayTasks.filter(t => !t.ai_metadata?.priority && !t.priority);

  const completedCount = todayTasks.filter(t => t.completed).length;

  const handleSetOneThing = async () => {
    if (!oneThingInput.trim()) return;

    try {
      await createTasks([{
        title: oneThingInput.trim(),
        is_focus: true,
        focus_date: todayDate,
        scheduled_bucket: 'today',
        priority: 'MUST',
      }]);

      setOneThingInput("");
      toast({
        description: "ONE thing set for today",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error setting ONE thing:', error);
      toast({
        description: "Failed to set ONE thing",
        variant: "destructive",
        duration: 2000,
      });
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

  const handleQuickWinClick = async (quickWin: { id: string; title: string }) => {
    try {
      await createTasks([{
        title: quickWin.title,
        scheduled_bucket: 'today',
        is_tiny_task: true,
      }]);
      
      toast({
        description: "Added to today",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        description: "Failed to add task",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const renderTaskGroup = (tasks: typeof todayTasks, label?: string) => {
    if (tasks.length === 0) return null;

    return (
      <div className="space-y-2">
        {label && (
          <div className="h-px bg-border/20 my-4" />
        )}
        {tasks.map((task) => (
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
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <SimpleHeader title="Today" />
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
        {/* Current Date */}
        <div className="mb-8 text-center">
          <p className="text-xs text-muted-foreground/50 font-mono tracking-wide">
            {todayFormatted}
          </p>
        </div>

        {/* ONE Thing Section */}
        <div className="mb-12">
          {oneThing ? (
            <div className="space-y-4">
              <h2 className="text-lg font-mono text-center text-foreground/70">
                Your ONE thing today
              </h2>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 text-center">
                <p className="text-xl font-mono text-foreground">
                  {oneThing.title}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-mono text-center text-foreground/70">
                What's the ONE thing that would make today a success?
              </h2>
              <div className="relative">
                <input
                  type="text"
                  value={oneThingInput}
                  onChange={(e) => setOneThingInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSetOneThing();
                    }
                  }}
                  placeholder="Type and press enter..."
                  className="w-full bg-transparent border-0 border-b border-border/30 focus:border-foreground/40 transition-all font-mono text-base py-3 px-0 placeholder:text-muted-foreground/40 outline-none text-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Wins Section */}
        {intelligence?.quick_wins && intelligence.quick_wins.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40 mb-4">
              Quick Wins
            </h3>
            <div className="space-y-2">
              {intelligence.quick_wins.slice(0, 5).map((win) => (
                <button
                  key={win.id}
                  onClick={() => handleQuickWinClick(win)}
                  className="w-full flex items-center gap-3 py-2.5 px-3 hover:bg-muted/20 rounded-md transition-colors group text-left"
                >
                  <div className="w-4 h-4 rounded-full border border-foreground/20 group-hover:border-primary transition-colors flex items-center justify-center">
                    <Check className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="flex-1 font-mono text-[14px] text-foreground/70 group-hover:text-foreground transition-colors">
                    {win.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Today's Tasks */}
        <div className="mb-8">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40 mb-4">
            Today's Tasks
          </h3>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground/40 text-sm">Loading...</p>
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground/40 text-sm">No tasks scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-1">
              {renderTaskGroup(mustTasks)}
              {renderTaskGroup(shouldTasks, shouldTasks.length > 0 && mustTasks.length > 0 ? 'should' : undefined)}
              {renderTaskGroup(couldTasks, couldTasks.length > 0 && (mustTasks.length > 0 || shouldTasks.length > 0) ? 'could' : undefined)}
              {renderTaskGroup(otherTasks, otherTasks.length > 0 && (mustTasks.length > 0 || shouldTasks.length > 0 || couldTasks.length > 0) ? 'other' : undefined)}
            </div>
          )}
        </div>

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

export default Today;
