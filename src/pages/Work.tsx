import { useState } from "react";
import { TaskPageLayout } from "@/components/layout/TaskPageLayout";
import { TaskCapture } from "@/components/tasks/TaskCapture";
import { WorkTaskList } from "@/components/tasks/WorkTaskList";
import { ShowCompletedToggle } from "@/components/shared/ShowCompletedToggle";
import { useTasks } from "@/hooks/useTasks";

const Work = () => {
  const { tasks } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);

  // Get work tasks for completed count
  const workTasks = tasks?.filter(t => t.category === 'work') || [];
  const completedCount = workTasks.filter(t => t.completed).length;

  return (
    <TaskPageLayout title="Work">
      <TaskCapture placeholder="Add a work task..." category="work" />
      <WorkTaskList showCompleted={showCompleted} />
      <ShowCompletedToggle
        count={completedCount}
        isVisible={showCompleted}
        onToggle={() => setShowCompleted(!showCompleted)}
      />
    </TaskPageLayout>
  );
};

export default Work;
