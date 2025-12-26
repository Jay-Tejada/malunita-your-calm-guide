import { useMemo, useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { WorkTaskRow } from "@/components/work/WorkTaskRow";

interface WorkTaskListProps {
  showCompleted: boolean;
}

export const WorkTaskList = ({ showCompleted }: WorkTaskListProps) => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  const { data: projects } = useProjectTasks();

  // Memoize filtered work tasks
  const workTasks = useMemo(() => 
    tasks?.filter(t => {
      if (showCompleted && t.completed) return t.category === 'work';
      if (!showCompleted && t.completed) return false;
      return t.category === 'work';
    }) || [], 
    [tasks, showCompleted]
  );

  // Memoize callbacks to prevent re-renders
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

  // Memoize grouped tasks
  const { tasksWithoutProjects, tasksByProject } = useMemo(() => {
    const withoutProjects = workTasks.filter(t => !t.plan_id);
    const withProjects = workTasks.filter(t => t.plan_id);
    
    const byProject = withProjects.reduce((acc, task) => {
      const projectId = task.plan_id!;
      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push(task);
      return acc;
    }, {} as Record<string, typeof workTasks>);
    
    return { tasksWithoutProjects: withoutProjects, tasksByProject: byProject };
  }, [workTasks]);

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
    <div className="space-y-1 mb-8">
      {/* Ungrouped tasks first */}
      {tasksWithoutProjects.map((task) => (
        <WorkTaskRow
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
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/30 mt-6 mb-2 px-3">
              {project?.title || 'Project'}
            </h3>
            {projectTasks.map((task) => (
              <WorkTaskRow
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={handleEdit}
                projectName={project?.title}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};
