import { useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { Task } from '@/hooks/useTasks';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTaskItem } from './SortableTaskItem';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectSectionProps {
  project: Project;
  tasks: Task[];
  onToggleCollapse: () => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (text: string, projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onReorderTasks?: (taskIds: string[]) => void;
}

export const ProjectSection = ({
  project,
  tasks,
  onToggleCollapse,
  onToggleTask,
  onAddTask,
  onEditProject,
  onDeleteProject,
  onReorderTasks
}: ProjectSectionProps) => {
  const [inputValue, setInputValue] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const incompleteTasks = tasks.filter(t => !t.completed);
  const isCollapsed = project.is_collapsed;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddTask(inputValue.trim(), project.id);
      setInputValue('');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (over && active.id !== over.id) {
      const oldIndex = incompleteTasks.findIndex((t) => t.id === active.id);
      const newIndex = incompleteTasks.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(incompleteTasks, oldIndex, newIndex);
      onReorderTasks?.(reordered.map(t => t.id));
    }
  };

  const activeTask = activeTaskId ? incompleteTasks.find(t => t.id === activeTaskId) : null;

  return (
    <div className="mb-2">
      {/* Project header - container style */}
      <div className="bg-muted/30 rounded-lg py-3 px-4 flex items-center justify-between group">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
          {project.icon && <span className="text-base">{project.icon}</span>}
          <span className="font-medium text-sm text-foreground/80">
            {project.name}
          </span>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {incompleteTasks.length} active
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditProject(project)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteProject(project.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Project tasks */}
      {!isCollapsed && (
        <div className="pl-8 pr-4 pb-3 pt-2">
          {incompleteTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No tasks</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={incompleteTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {incompleteTasks.map(task => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onToggleTask={onToggleTask}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeTask && (
                  <div className="bg-background border border-primary/30 rounded-md shadow-lg px-3 py-2 opacity-90">
                    <span className="font-mono text-sm text-foreground/70">{activeTask.title}</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
          
          {/* Add task to project */}
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add task..."
            className="w-full bg-transparent font-mono text-xs text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none py-2 mt-1"
          />
        </div>
      )}
    </div>
  );
};
