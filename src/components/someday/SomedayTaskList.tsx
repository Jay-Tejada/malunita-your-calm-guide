import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { TaskRow } from "@/components/shared/TaskRow";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SomedayTaskListProps {
  showCompleted: boolean;
}

export const SomedayTaskList = ({ showCompleted }: SomedayTaskListProps) => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  const { toast } = useToast();

  // Get someday tasks: scheduled = 'someday' OR (no due date AND category = 'someday')
  const somedayTasks = tasks?.filter(t => {
    const isSomedayTask = t.scheduled_bucket === 'someday' || 
      (!t.scheduled_bucket && t.category === 'someday');
    
    if (showCompleted && t.completed) return isSomedayTask;
    if (!showCompleted && t.completed) return false;
    return isSomedayTask;
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
    // Edit functionality to be implemented
    console.log('Edit task:', id);
  };

  const handleMoveToToday = async (taskId: string) => {
    try {
      await updateTask({
        id: taskId,
        updates: {
          scheduled_bucket: 'today',
        }
      });
      
      toast({
        description: "Moved to Today",
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to move task:", error);
      toast({
        description: "Failed to move task",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/40 text-sm font-mono">Loading...</p>
      </div>
    );
  }

  if (somedayTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/30">Nothing here yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 mb-8">
      {somedayTasks.map((task) => (
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
