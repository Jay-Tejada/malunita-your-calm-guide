import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, Plus } from 'lucide-react';
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

interface ProjectSectionProps {
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

export const ProjectSection = ({
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
}: ProjectSectionProps) => {
  const [inputValue, setInputValue] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
  const handlePlusClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="mb-2 px-4">
      {/* Project header - minimal */}
      <div className="flex items-center gap-2 py-2">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isCollapsed ? (
            <ChevronRight size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
          <Folder size={16} className="text-muted-foreground" />
          <span className="font-medium text-sm text-foreground/80">
            {project.name}
          </span>
        </button>
        
        <button 
          onClick={handlePlusClick}
          className="p-1 hover:bg-foreground/10 rounded text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus size={14} />
        </button>
        <span className="text-sm text-muted-foreground">
          {incompleteTasks.length} active
        </span>
      </div>
      
      {/* Project tasks */}
      {!isCollapsed && (
        <div className="pl-4 ml-4 mt-2 border-l border-foreground/5 space-y-1 pb-3">
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
                {incompleteTasks.filter(t => !t.parent_task_id).map(task => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    allTasks={allTasks}
                    onToggleTask={onToggleTask}
                    onUpdateTask={onUpdateTask}
                    onAddSubtask={onAddSubtask}
                    onDeleteTask={onDeleteTask}
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
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Add task to ${project.name}...`}
            className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none py-2 mt-2 border-none"
          />
        </div>
      )}
    </div>
  );
};
