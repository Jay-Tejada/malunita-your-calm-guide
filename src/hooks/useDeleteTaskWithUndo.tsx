import { useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Task, useTasks } from '@/hooks/useTasks';

export const useDeleteTaskWithUndo = () => {
  const { deleteTask, createTasks } = useTasks();
  const pendingRestoreRef = useRef<Task | null>(null);

  const deleteTaskWithUndo = useCallback(async (task: Task, allTasks: Task[]) => {
    // Find all subtasks that will be deleted
    const subtasks = allTasks.filter(t => t.parent_task_id === task.id);
    const hasSubtasks = subtasks.length > 0;
    
    // Store task data for potential restore
    pendingRestoreRef.current = task;
    
    // Delete the task (subtasks are handled by cascading delete or need separate handling)
    await deleteTask(task.id);
    
    // Show toast with undo action
    toast({
      title: "Task deleted",
      description: `"${task.title}"${hasSubtasks ? ` and ${subtasks.length} subtask${subtasks.length > 1 ? 's' : ''}` : ''} removed`,
      action: (
        <button
          onClick={async () => {
            if (pendingRestoreRef.current) {
              // Recreate the task
              await createTasks([{
                title: pendingRestoreRef.current.title,
                category: pendingRestoreRef.current.category || undefined,
                project_id: pendingRestoreRef.current.project_id || undefined,
                parent_task_id: pendingRestoreRef.current.parent_task_id || undefined,
              }]);
              pendingRestoreRef.current = null;
              toast({
                title: "Task restored",
                description: "Your task has been restored",
              });
            }
          }}
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Undo
        </button>
      ),
    });
  }, [deleteTask, createTasks]);

  return { deleteTaskWithUndo };
};
