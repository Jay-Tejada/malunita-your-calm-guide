import { useState, KeyboardEvent } from "react";
import { TaskList } from "@/components/TaskList";
import { SimpleHeader } from "@/components/SimpleHeader";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { InboxActions } from "@/components/InboxActions";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";
import { useToast } from "@/hooks/use-toast";


const Inbox = () => {
  const navigate = useNavigate();
  const { tasks, isLoading, createTasks } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const [quickInput, setQuickInput] = useState("");
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();
  const { toast } = useToast();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  const handleQuickCapture = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickInput.trim()) {
      e.preventDefault();
      
      try {
        await createTasks([{
          title: quickInput.trim(),
          category: 'inbox',
        }]);
        
        setQuickInput("");
        toast({
          description: "Captured",
          duration: 1500,
        });
      } catch (error) {
        console.error('Error creating task:', error);
        toast({
          description: "Failed to capture",
          variant: "destructive",
          duration: 2000,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <SimpleHeader title="Inbox" />
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
        <div className="flex items-center gap-4 mb-6 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">📥 Inbox</h1>
            <p className="text-muted-foreground mt-1">
              Uncategorized tasks waiting to be organized
            </p>
          </div>
        </div>

        {/* Quick capture input */}
        <div className="mb-6">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={handleQuickCapture}
            placeholder="Capture a thought..."
            className="w-full bg-transparent border-0 border-b border-border/30 focus:border-foreground/40 outline-none transition-colors font-mono text-sm py-2 px-0 placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Inbox Actions */}
          {!isLoading && tasks && <InboxActions tasks={tasks} />}
          
          <TaskList category="inbox" onPlanThis={handlePlanThis} />
        </div>
      </main>
    </div>
  );
};

export default Inbox;
