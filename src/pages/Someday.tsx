import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";
import { TaskPageLayout } from "@/components/shared/TaskPageLayout";
import { SomedayIntro } from "@/components/someday/SomedayIntro";
import { SomedayTaskList } from "@/components/someday/SomedayTaskList";
import { ShowCompletedToggle } from "@/components/shared/ShowCompletedToggle";

const Someday = () => {
  const { tasks } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  // Get someday tasks for completed count
  const somedayTasks = tasks?.filter(t => 
    t.scheduled_bucket === 'someday'
  ) || [];

  const completedCount = somedayTasks.filter(t => t.completed).length;
  const hasAnyTasks = somedayTasks.length > 0;

  return (
    <TaskPageLayout
      title="Someday"
      placeholder="Add something for later..."
      category="someday"
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

      <SomedayIntro hasAnyTasks={hasAnyTasks} />
      <SomedayTaskList showCompleted={showCompleted} />
      <ShowCompletedToggle
        count={completedCount}
        isVisible={showCompleted}
        onToggle={() => setShowCompleted(!showCompleted)}
      />
    </TaskPageLayout>
  );
};

export default Someday;
