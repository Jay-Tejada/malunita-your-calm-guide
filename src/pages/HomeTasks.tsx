import { useState, KeyboardEvent } from "react";
import { TaskList } from "@/components/TaskList";
import { SimpleHeader } from "@/components/SimpleHeader";
import { ArrowRight, Check } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const HomeTasks = () => {
  const { createTasks } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const [quickInput, setQuickInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
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
        category: 'home',
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <SimpleHeader title="Home" />
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
              placeholder="Capture a thought..."
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

        <div className="max-w-4xl mx-auto">
          <TaskList category="home" onPlanThis={handlePlanThis} />
        </div>
      </main>
    </div>
  );
};

export default HomeTasks;
