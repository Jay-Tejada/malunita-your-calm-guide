import { useTasks } from "@/hooks/useTasks";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { TaskRow } from "@/components/shared/TaskRow";

interface WorkTaskListProps {
  showCompleted: boolean;
}

export const WorkTaskList = ({ showCompleted }: WorkTaskListProps) => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  const { data: projects } = useProjectTasks();

  // Filter work tasks
  const workTasks = tasks?.filter(t => {
    if (showCompleted && t.completed) return t.category === 'work';
    if (!showCompleted && t.completed) return false;
    return t.category === 'work';
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

  // Group by project
  const tasksWithoutProjects = workTasks.filter(t => !t.plan_id);
  const tasksWithProjects = workTasks.filter(t => t.plan_id);

  // Group tasks by project
  const tasksByProject = tasksWithProjects.reduce((acc, task) => {
    const projectId = task.plan_id!;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {} as Record<string, typeof workTasks>);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/30">Loading...</p>
      </div>
    );
  }

  if (workTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/30">No work tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 mb-8">
      {/* Ungrouped tasks first (implicit "General" group - no header) */}
      {tasksWithoutProjects.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      ))}

      {/* Tasks grouped by project */}
      {Object.entries(tasksByProject).map(([projectId, projectTasks]) => {
        const project = projects?.find(p => p.id === projectId);
        return (
          <div key={projectId}>
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/30 mt-6 mb-2">
              {project?.title || 'Project'}
            </h3>
            {projectTasks.map((task) => (
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
      })}
    </div>
  );
};
