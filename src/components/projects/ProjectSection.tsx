import { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';
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
import { WorkSortableTaskItem } from '@/components/work/WorkSortableTaskItem';
import { ProjectHeader } from '@/components/project/ProjectTaskRow';

interface DragHandleProps {
  attributes?: Record<string, any>;
  listeners?: Record<string, any>;
}

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
  dragHandleProps?: DragHandleProps;
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
  onReorderTasks,
  dragHandleProps
}: ProjectSectionProps) => {
  const [inputValue, setInputValue] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
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
      // Keep input open and focused for flow mode
      setTimeout(() => inputRef.current?.focus(), 10);
    }
    if (e.key === 'Escape') {
      setInputValue('');
      setShowInput(false);
      inputRef.current?.blur();
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
  
  const handleAddTaskClick = () => {
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="mb-2 px-4 group/project">
      {/* Project header with progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ProjectHeader
            name={project.name}
            icon={project.icon || undefined}
            totalTasks={tasks.length}
            completedTasks={completedTasks.length}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            onAddTask={handleAddTaskClick}
          />
        </div>
        
        {/* Drag handle */}
        {dragHandleProps && (
          <button
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            className="p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover/project:opacity-100 text-foreground/30 hover:text-foreground/50 transition-opacity touch-none"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Project tasks */}
      {!isCollapsed && (
        <div className="pl-4 ml-4 mt-2 border-l border-foreground/5 space-y-0.5 pb-3">
          {incompleteTasks.length === 0 && !showInput ? (
            <p className="text-xs text-muted-foreground/40 py-2">No tasks yet</p>
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
                  <WorkSortableTaskItem
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
              <DragOverlay dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}>
                {activeTask && (
                  <div className="bg-background/95 backdrop-blur-sm border border-primary/40 rounded-lg shadow-xl px-3 py-2.5 scale-105 ring-2 ring-primary/20">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-primary/50 flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">
                        {(activeTask as any).ai_summary || activeTask.title}
                      </span>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
          
          {/* Add task to project */}
          {showInput && (
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!inputValue.trim()) setShowInput(false);
              }}
              placeholder={`Add task to ${project.name}...`}
              className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none py-2 mt-1 border-none"
            />
          )}
        </div>
      )}
    </div>
  );
};
