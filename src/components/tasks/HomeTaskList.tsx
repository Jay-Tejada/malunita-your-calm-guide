import { useTasks } from "@/hooks/useTasks";
import { TaskRow } from "@/components/shared/TaskRow";

interface HomeTaskListProps {
  showCompleted: boolean;
}

export const HomeTaskList = ({ showCompleted }: HomeTaskListProps) => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();

  // Filter home tasks
  const homeTasks = tasks?.filter(t => {
    if (showCompleted && t.completed) return t.category === 'home';
    if (!showCompleted && t.completed) return false;
    return t.category === 'home';
  }) || [];

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

  if (homeTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/30">No home tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 mb-8">
      {homeTasks.map((task) => (
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
