import { useState } from "react";
import { TaskList } from "@/components/TaskList";
import { useTasks } from "@/hooks/useTasks";
import { InboxActions } from "@/components/InboxActions";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";
import { TaskPageLayout } from "@/components/shared/TaskPageLayout";


const Inbox = () => {
  const { tasks, isLoading } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  return (
    <TaskPageLayout
      title="Inbox"
      placeholder="Capture a thought..."
      category="inbox"
    >
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

      {/* Inbox Actions */}
      {!isLoading && tasks && <InboxActions tasks={tasks} />}
      
      {/* Task List */}
      <TaskList category="inbox" onPlanThis={handlePlanThis} />
    </TaskPageLayout>
  );
};

export default Inbox;
