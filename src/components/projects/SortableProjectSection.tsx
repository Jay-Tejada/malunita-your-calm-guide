import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project } from '@/hooks/useProjects';
import { Task } from '@/hooks/useTasks';
import { ProjectSection } from './ProjectSection';

interface SortableProjectSectionProps {
  project: Project;
  tasks: Task[];
  allTasks: Task[];
  onToggleCollapse: () => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (text: string, projectId: string) => void;
  onUpdateTask: (taskId: string, title: string) => void;
  onAddSubtask: (parentId: string, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onReorderTasks?: (taskIds: string[]) => void;
}

export const SortableProjectSection = ({
  project,
  tasks,
  allTasks,
  onToggleCollapse,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onAddSubtask,
  onDeleteTask,
  onEditProject,
  onDeleteProject,
  onReorderTasks
}: SortableProjectSectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${
        isDragging 
          ? 'opacity-50 bg-primary/5 rounded-md shadow-md z-20' 
          : ''
      }`}
    >
      <ProjectSection
        project={project}
        tasks={tasks}
        allTasks={allTasks}
        onToggleCollapse={onToggleCollapse}
        onToggleTask={onToggleTask}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onAddSubtask={onAddSubtask}
        onDeleteTask={onDeleteTask}
        onEditProject={onEditProject}
        onDeleteProject={onDeleteProject}
        onReorderTasks={onReorderTasks}
        dragHandleProps={{ attributes, listeners }}
      />
    </div>
  );
};
