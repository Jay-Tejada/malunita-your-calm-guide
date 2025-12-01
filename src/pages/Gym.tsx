import { useState } from "react";
import { TaskPageLayout } from "@/components/layout/TaskPageLayout";
import { TaskCapture } from "@/components/tasks/TaskCapture";
import { TaskList } from "@/components/tasks/TaskList";
import { ShowCompletedToggle } from "@/components/tasks/ShowCompletedToggle";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { useTasks } from "@/hooks/useTasks";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";

const Gym = () => {
  const { tasks, isLoading } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  // Get gym tasks
  const gymTasks = tasks?.filter(t => {
    if (showCompleted && t.completed) return t.category === 'gym';
    if (!showCompleted && t.completed) return false;
    return t.category === 'gym';
  }) || [];

  const completedCount = gymTasks.filter(t => t.completed).length;

  return (
    <TaskPageLayout title="Gym">
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

      <TaskCapture placeholder="Add a fitness task..." category="gym" />
      
      <TaskList
        tasks={gymTasks}
        isLoading={isLoading}
        emptyMessage="No fitness tasks"
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

export default Gym;
