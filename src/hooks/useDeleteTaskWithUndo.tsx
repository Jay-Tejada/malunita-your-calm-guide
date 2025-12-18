import { useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Task, useTasks } from '@/hooks/useTasks';

interface PendingRestore {
  task: Task;
  subtasks: Task[];
}

export const useDeleteTaskWithUndo = () => {
  const { deleteTask, createTasks } = useTasks();
  const pendingRestoreRef = useRef<PendingRestore | null>(null);

  const deleteTaskWithUndo = useCallback(async (task: Task, allTasks: Task[]) => {
    // Find all subtasks that will be deleted
    const subtasks = allTasks.filter(t => t.parent_task_id === task.id);
    const hasSubtasks = subtasks.length > 0;
    
    // Store task and subtasks data for potential restore
    pendingRestoreRef.current = { task, subtasks };
    
    // Delete the task (subtasks are handled by cascading delete)
    await deleteTask(task.id);
    
    // Show toast with undo action
    toast({
      title: "Task deleted",
      description: `"${task.title}"${hasSubtasks ? ` and ${subtasks.length} subtask${subtasks.length > 1 ? 's' : ''}` : ''} removed`,
      action: (
        <button
          onClick={async () => {
            if (pendingRestoreRef.current) {
              const { task: parentTask, subtasks: deletedSubtasks } = pendingRestoreRef.current;
              
              // Recreate the parent task first
              const createdTasks = await createTasks([{
                title: parentTask.title,
                category: parentTask.category || undefined,
                project_id: parentTask.project_id || undefined,
                parent_task_id: parentTask.parent_task_id || undefined,
              }]);
              
              // If there were subtasks, recreate them with the new parent id
              if (deletedSubtasks.length > 0 && createdTasks && createdTasks.length > 0) {
                const newParentId = createdTasks[0].id;
                await createTasks(deletedSubtasks.map(subtask => ({
                  title: subtask.title,
                  category: subtask.category || undefined,
                  project_id: subtask.project_id || undefined,
                  parent_task_id: newParentId,
                })));
              }
              
              pendingRestoreRef.current = null;
              toast({
                title: "Task restored",
                description: deletedSubtasks.length > 0 
                  ? `Task and ${deletedSubtasks.length} subtask${deletedSubtasks.length > 1 ? 's' : ''} restored`
                  : "Your task has been restored",
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
