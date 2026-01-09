import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useCapture } from '@/hooks/useAICapture';
import { useProjects, Project } from '@/hooks/useProjects';
import { useDeleteTaskWithUndo } from '@/hooks/useDeleteTaskWithUndo';
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
import { QuickAddInput } from '@/components/shared/QuickAddInput';
import { SortableProjectSection } from '@/components/projects/SortableProjectSection';
import { NewProjectModal } from '@/components/projects/NewProjectModal';

const Work = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const { capture, isCapturing } = useCapture();
  const { projects, createProject, updateProject, deleteProject, toggleCollapsed, reorderProjects } = useProjects('work');
  const { deleteTaskWithUndo } = useDeleteTaskWithUndo();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // 'q' key focuses the input for quick capture - use capture phase to intercept before global handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'q' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Stop global handler from firing
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true); // capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);
  
  const workTasks = tasks?.filter(t => 
    t.category === 'work' && !t.completed
  ) || [];
  
  const completedTasks = tasks?.filter(t => 
    t.category === 'work' && t.completed
  ) || [];

  // Debug: Log projects loaded
  console.log('📂 Projects loaded:', projects.map(p => ({ id: p.id, name: p.name })));

  // Group tasks by project, sorted by display_order
  const tasksByProject = useMemo(() => {
    const grouped: Record<string, Task[]> = { uncategorized: [] };
    
    // Initialize groups for each project
    projects.forEach(p => {
      grouped[p.id] = [];
    });
    
    // Sort by display_order first
    const sortedTasks = [...workTasks].sort((a, b) => 
      (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    
    sortedTasks.forEach(task => {
      const projectExists = task.project_id && grouped[task.project_id] !== undefined;
      
      // Debug: Log task grouping decision
      if (task.project_id) {
        console.log(`📋 Task "${task.title.substring(0, 30)}..." has project_id: ${task.project_id}, project exists: ${projectExists}`);
      }
      
      if (projectExists) {
        grouped[task.project_id!].push(task);
      } else {
        grouped.uncategorized.push(task);
      }
    });
    
    console.log('📊 Tasks grouped:', Object.entries(grouped).map(([k, v]) => `${k}: ${v.length} tasks`));
    
    return grouped;
  }, [workTasks, projects]);

  const handleCapture = async (text: string, projectId?: string) => {
    console.log('📝 Creating work task via AI pipeline, project_id:', projectId);
    // Route through AI pipeline for full processing
    await capture({
      text,
      category: 'work',
      project_id: projectId || undefined
    });
  };

  const handleCreateProject = async (project: { name: string; space: string; icon?: string; color?: string }) => {
    await createProject(project);
    setShowNewProject(false);
  };

  const handleToggleTask = (taskId: string) => {
    updateTask({ id: taskId, updates: { completed: true } });
  };

  const handleUpdateTask = (taskId: string, title: string) => {
    updateTask({ id: taskId, updates: { title } });
  };

  const handleAddSubtask = async (parentId: string, title: string) => {
    const parentTask = tasks?.find(t => t.id === parentId);
    // Route subtask through AI pipeline for enrichment
    await capture({
      text: title,
      category: 'work',
      project_id: parentTask?.project_id || undefined
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (task) {
      await deleteTaskWithUndo(task, tasks || []);
    }
  };

  const handleReorderTasks = async (taskIds: string[]) => {
    // Update display_order for each task
    await Promise.all(
      taskIds.map((id, index) =>
        updateTask({ id, updates: { display_order: index } })
      )
    );
  };

  const handleProjectDragStart = (event: DragStartEvent) => {
    setActiveProjectId(event.active.id as string);
  };

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProjectId(null);
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(projects, oldIndex, newIndex);
      reorderProjects(reordered.map(p => p.id));
    }
  };

  const activeProject = activeProjectId ? projects.find(p => p.id === activeProjectId) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground font-medium">Work</span>
        <button 
          onClick={() => setShowNewProject(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="pb-24 md:pb-4">
        {/* Quick Add Input - always visible at top */}
        <div className="px-4 pt-4">
          <QuickAddInput 
            placeholder="Add a work task..." 
            category="work"
          />
        </div>

        {/* Projects */}
        <div className="mt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleProjectDragStart}
            onDragEnd={handleProjectDragEnd}
          >
            <SortableContext
              items={projects.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {projects.map(project => (
                <SortableProjectSection
                  key={project.id}
                  project={project}
                  tasks={tasksByProject[project.id] || []}
                  allTasks={tasks || []}
                  onToggleCollapse={() => toggleCollapsed(project.id)}
                  onToggleTask={handleToggleTask}
                  onAddTask={(text, projectId) => handleCapture(text, projectId)}
                  onUpdateTask={handleUpdateTask}
                  onAddSubtask={handleAddSubtask}
                  onDeleteTask={handleDeleteTask}
                  onEditProject={setEditingProject}
                  onDeleteProject={deleteProject}
                  onReorderTasks={handleReorderTasks}
                />
              ))}
            </SortableContext>
            <DragOverlay dropAnimation={{
              duration: 200,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
              {activeProject && (
                <div className="bg-background/95 backdrop-blur-sm border border-primary/40 rounded-lg shadow-xl px-4 py-3 scale-105 ring-2 ring-primary/20">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
                      <span className="text-xs">{activeProject.icon || '📁'}</span>
                    </div>
                    <span className="font-medium text-sm text-foreground">
                      {activeProject.name}
                    </span>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Uncategorized tasks */}
          {tasksByProject.uncategorized.length > 0 && (
            <div className="px-4 py-3">
              {projects.length > 0 && (
                <p className="text-[10px] uppercase tracking-widest text-accent font-medium mb-3">
                  Other
                </p>
              )}
              {tasksByProject.uncategorized.map(task => (
                <div key={task.id} className="flex items-start gap-3 py-2">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className="w-4 h-4 rounded-full border border-muted-foreground hover:border-foreground flex-shrink-0 mt-0.5 transition-colors"
                  />
                  <span className="font-mono text-sm text-foreground">{task.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {projects.length === 0 && tasksByProject.uncategorized.length === 0 && (
            <p className="text-muted-foreground text-center py-12">No work tasks</p>
          )}
        </div>

        {/* Show completed toggle */}
        {completedTasks.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-4 transition-colors"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
          </button>
        )}
      </div>

      {/* Removed - Quick Add is at top */}

      {/* New project modal */}
      {showNewProject && (
        <NewProjectModal
          space="work"
          onClose={() => setShowNewProject(false)}
          onSave={handleCreateProject}
        />
      )}
    </div>
  );
};

export default Work;
