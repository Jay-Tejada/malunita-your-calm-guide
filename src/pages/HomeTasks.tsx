import { useState } from "react";
import { TaskPageLayout } from "@/components/layout/TaskPageLayout";
import { TaskCapture } from "@/components/tasks/TaskCapture";
import { HomeTaskList } from "@/components/tasks/HomeTaskList";
import { ShowCompletedToggle } from "@/components/shared/ShowCompletedToggle";
import { useTasks } from "@/hooks/useTasks";

const HomeTasks = () => {
  const { tasks } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);

  // Get home tasks for completed count
  const homeTasks = tasks?.filter(t => t.category === 'home') || [];
  const completedCount = homeTasks.filter(t => t.completed).length;

  return (
    <TaskPageLayout title="Home">
      <TaskCapture placeholder="Add a home task..." category="home" />
      <HomeTaskList showCompleted={showCompleted} />
      <ShowCompletedToggle
        count={completedCount}
        isVisible={showCompleted}
        onToggle={() => setShowCompleted(!showCompleted)}
      />
    </TaskPageLayout>
  );
};

export default HomeTasks;
