import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";
import { TaskPageLayout } from "@/components/shared/TaskPageLayout";
import { DateSubtitle } from "@/components/today/DateSubtitle";
import { OneThingSection } from "@/components/today/OneThingSection";
import { QuickWinsSection } from "@/components/today/QuickWinsSection";
import { TodayTaskList } from "@/components/today/TodayTaskList";
import { ShowCompletedToggle } from "@/components/shared/ShowCompletedToggle";

const Today = () => {
  const { tasks } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  const todayDate = new Date().toISOString().split('T')[0];
  const todayTasks = tasks?.filter(t => {
    if (showCompleted && t.completed) return true;
    if (!showCompleted && t.completed) return false;
    return t.scheduled_bucket === 'today' || t.focus_date === todayDate;
  }) || [];

  const completedCount = todayTasks.filter(t => t.completed).length;

  return (
    <TaskPageLayout
      title="Today"
      showCapture={false}
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

      <DateSubtitle />
      <OneThingSection />
      <QuickWinsSection />
      <TodayTaskList showCompleted={showCompleted} />
      <ShowCompletedToggle
        count={completedCount}
        isVisible={showCompleted}
        onToggle={() => setShowCompleted(!showCompleted)}
      />
    </TaskPageLayout>
  );
};

export default Today;
