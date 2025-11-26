import { useState } from "react";
import { TaskList } from "@/components/TaskList";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { InboxActions } from "@/components/InboxActions";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";


const Inbox = () => {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">📥 Inbox</h1>
            <p className="text-muted-foreground mt-1">
              Uncategorized tasks waiting to be organized
            </p>
          </div>
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
