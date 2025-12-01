import { useTasks } from "@/hooks/useTasks";
import { TaskRow } from "@/components/shared/TaskRow";

interface GymTaskListProps {
  showCompleted: boolean;
}

export const GymTaskList = ({ showCompleted }: GymTaskListProps) => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();

  // Filter gym tasks and sort by created_at descending (newest first)
  const gymTasks = tasks?.filter(t => {
    if (showCompleted && t.completed) return t.category === 'gym';
    if (!showCompleted && t.completed) return false;
    return t.category === 'gym';
  }).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) || [];

  const handleComplete = async (id: string) => {
    await updateTask({
      id,
      updates: {
        completed: true,
        completed_at: new Date().toISOString(),
      }
    });
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
  };

  const handleEdit = (id: string) => {
    console.log('Edit task:', id);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/30">Loading...</p>
      </div>
    );
  }

  if (gymTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/30">No fitness tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 mb-8">
      {gymTasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      ))}
    </div>
  );
};
