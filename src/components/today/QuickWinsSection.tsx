import { useTasks } from "@/hooks/useTasks";
import { TaskRow } from "@/components/shared/TaskRow";

export const QuickWinsSection = () => {
  const { tasks, updateTask, deleteTask } = useTasks();

  // Filter for quick wins: tiny tasks scheduled for today that aren't completed
  const quickWinTasks = tasks?.filter(t => 
    !t.completed && 
    (t.is_tiny || t.is_tiny_task) &&
    (t.scheduled_bucket === 'today' || t.focus_date === new Date().toISOString().split('T')[0])
  ).slice(0, 5) || [];

  if (quickWinTasks.length === 0) {
    return null;
  }

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
    // Edit functionality to be implemented
    console.log('Edit task:', id);
  };

  return (
    <div className="mb-8">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/30 mb-2">
        Quick wins
      </h3>
      <div className="space-y-0">
        {quickWinTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>
    </div>
  );
};
