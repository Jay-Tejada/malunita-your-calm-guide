import { useState } from "react";
import { TaskPageLayout } from "@/components/layout/TaskPageLayout";
import { TaskCapture } from "@/components/tasks/TaskCapture";
import { GymTaskList } from "@/components/tasks/GymTaskList";
import { ShowCompletedToggle } from "@/components/shared/ShowCompletedToggle";
import { useTasks } from "@/hooks/useTasks";

const Gym = () => {
  const { tasks } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);

  // Get gym tasks for completed count
  const gymTasks = tasks?.filter(t => t.category === 'gym') || [];
  const completedCount = gymTasks.filter(t => t.completed).length;

  return (
    <TaskPageLayout title="Gym">
      <TaskCapture placeholder="Add a fitness task..." category="gym" />
      <GymTaskList showCompleted={showCompleted} />
      <ShowCompletedToggle
        count={completedCount}
        isVisible={showCompleted}
        onToggle={() => setShowCompleted(!showCompleted)}
      />
    </TaskPageLayout>
  );
};

export default Gym;
