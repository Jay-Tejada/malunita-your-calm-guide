import { useState } from "react";
import { TaskPageLayout } from "@/components/layout/TaskPageLayout";
import { TaskCapture } from "@/components/tasks/TaskCapture";
import { WorkTaskList } from "@/components/tasks/WorkTaskList";
import { ShowCompletedToggle } from "@/components/tasks/ShowCompletedToggle";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { useTasks } from "@/hooks/useTasks";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";

const Work = () => {
  const { tasks, isLoading } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  // Get work tasks
  const workTasks = tasks?.filter(t => {
    if (showCompleted && t.completed) return t.category === 'work';
    if (!showCompleted && t.completed) return false;
    return t.category === 'work';
  }) || [];

  const completedCount = workTasks.filter(t => t.completed).length;

  return (
    <TaskPageLayout title="Work">
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

      <TaskCapture placeholder="Add a work task..." category="work" />
      
      <WorkTaskList
        tasks={workTasks}
        isLoading={isLoading}
        onPlanTask={handlePlanThis}
      />

      <ShowCompletedToggle
        completedCount={completedCount}
        showCompleted={showCompleted}
        onToggle={() => setShowCompleted(!showCompleted)}
      />
    </TaskPageLayout>
  );
};

export default Work;
