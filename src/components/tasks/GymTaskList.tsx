import { useMemo, useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";
import { TaskRow } from "@/components/shared/TaskRow";

interface GymTaskListProps {
  showCompleted: boolean;
}

export const GymTaskList = ({ showCompleted }: GymTaskListProps) => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();

  // Memoize filtered and sorted gym tasks
  const gymTasks = useMemo(() => 
    [...(tasks || [])]
      .filter(t => {
        if (showCompleted && t.completed) return t.category === 'gym';
        if (!showCompleted && t.completed) return false;
        return t.category === 'gym';
      })
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [tasks, showCompleted]
  );

  // Memoize callbacks
  const handleComplete = useCallback(async (id: string) => {
    await updateTask({
      id,
      updates: {
        completed: true,
        completed_at: new Date().toISOString(),
      }
    });
  }, [updateTask]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteTask(id);
  }, [deleteTask]);

  const handleEdit = useCallback((id: string) => {
    console.log('Edit task:', id);
  }, []);

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
