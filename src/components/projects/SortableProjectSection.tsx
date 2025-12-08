import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { Task } from '@/hooks/useTasks';
import { ProjectSection } from './ProjectSection';

interface SortableProjectSectionProps {
  project: Project;
  tasks: Task[];
  onToggleCollapse: () => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (text: string, projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onReorderTasks?: (taskIds: string[]) => void;
}

export const SortableProjectSection = ({
  project,
  tasks,
  onToggleCollapse,
  onToggleTask,
  onAddTask,
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
      className={`relative group/project ${isDragging ? 'opacity-50 bg-foreground/5 z-10' : ''}`}
    >
      {/* Drag handle for project */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-1 top-3.5 p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover/project:opacity-100 text-foreground/30 hover:text-foreground/50 transition-opacity touch-none z-10"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      
      <ProjectSection
        project={project}
        tasks={tasks}
        onToggleCollapse={onToggleCollapse}
        onToggleTask={onToggleTask}
        onAddTask={onAddTask}
        onEditProject={onEditProject}
        onDeleteProject={onDeleteProject}
        onReorderTasks={onReorderTasks}
      />
    </div>
  );
};
