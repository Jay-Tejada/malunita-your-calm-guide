import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, ChevronDown } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useDeleteTaskWithUndo } from '@/hooks/useDeleteTaskWithUndo';
import { QuickAddInput, QuickAddInputRef } from '@/components/shared/QuickAddInput';
import { SimpleTaskRow } from '@/components/shared/SimpleTaskRow';
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import { deduplicateTasks } from '@/utils/duplicateDetection';
import { cn } from '@/lib/utils';

const Work = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const { projects, createProject, toggleCollapsed } = useProjects('work');
  const { deleteTaskWithUndo } = useDeleteTaskWithUndo();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const inputRef = useRef<QuickAddInputRef>(null);

  // 'q' key focuses the input for quick capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'q' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);
  
  // All work tasks (incomplete) - deduplicated
  const workTasks = useMemo(() => {
    const filtered = (tasks || []).filter(t => t.category === 'work' && !t.completed);
    return deduplicateTasks(filtered);
  }, [tasks]);
  
  // Completed work tasks
  const completedTasks = useMemo(() => 
    (tasks || []).filter(t => t.category === 'work' && t.completed),
    [tasks]
  );

  // Group tasks by project - uncategorized first for task-first feel
  const { ungroupedTasks, projectGroups } = useMemo(() => {
    const ungrouped: Task[] = [];
    const grouped: Record<string, Task[]> = {};
    
    // Initialize groups for each project
    projects.forEach(p => {
      grouped[p.id] = [];
    });
    
    // Sort by display_order
    const sortedTasks = [...workTasks].sort((a, b) => 
      (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    
    sortedTasks.forEach(task => {
      if (task.project_id && grouped[task.project_id] !== undefined) {
        grouped[task.project_id].push(task);
      } else {
        ungrouped.push(task);
      }
    });
    
    return { ungroupedTasks: ungrouped, projectGroups: grouped };
  }, [workTasks, projects]);

  const handleCreateProject = async (project: { name: string; space: string; icon?: string; color?: string }) => {
    await createProject(project);
    setShowNewProject(false);
  };

  const handleCompleteTask = async (taskId: string) => {
    await updateTask({ 
      id: taskId, 
      updates: { 
        completed: true,
        completed_at: new Date().toISOString()
      } 
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (task) {
      await deleteTaskWithUndo(task, tasks || []);
    }
  };

  const handleEditTask = (taskId: string) => {
    console.log('Edit task:', taskId);
  };

  // Count total work tasks
  const totalTasks = workTasks.length;

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
          title="New project"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="pb-24 md:pb-4">
        {/* Quick Add Input - always visible at top */}
        <div className="px-4 pt-4 pb-2">
          <QuickAddInput 
            ref={inputRef}
            placeholder="Add a work task..." 
            category="work"
          />
        </div>

        {/* Task-first layout: Show all tasks immediately */}
        <div className="mt-2">
          {/* Ungrouped tasks first (no project) */}
          {ungroupedTasks.length > 0 && (
            <div className="px-4 mb-4">
              {projects.length > 0 && (
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2">
                  Tasks
                </p>
              )}
              <div className="space-y-0">
                {ungroupedTasks.map(task => (
                  <SimpleTaskRow
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Project groups - collapsible sections */}
          {projects.map(project => {
            const projectTasks = projectGroups[project.id] || [];
            if (projectTasks.length === 0 && project.is_collapsed) return null;
            
            return (
              <div key={project.id} className="mb-3">
                {/* Project header - cleaner Todoist style */}
                <button
                  onClick={() => toggleCollapsed(project.id)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors"
                >
                  <ChevronDown 
                    className={cn(
                      "w-3 h-3 text-muted-foreground/50 transition-transform",
                      project.is_collapsed && "-rotate-90"
                    )}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {project.name}
                  </span>
                  <span className="text-xs text-muted-foreground/50">
                    · {projectTasks.length}
                  </span>
                </button>

                {/* Project tasks */}
                {!project.is_collapsed && (
                  <div className="px-4 pl-8">
                    {projectTasks.length > 0 ? (
                      <div className="space-y-0">
                        {projectTasks.map(task => (
                          <SimpleTaskRow
                            key={task.id}
                            task={task}
                            onComplete={handleCompleteTask}
                            onDelete={handleDeleteTask}
                            onEdit={handleEditTask}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/40 py-2 italic">
                        No tasks
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state - task-first, not project-first */}
          {totalTasks === 0 && (
            <div className="text-center py-16 px-4">
              <p className="text-muted-foreground/60 text-sm">
                No work tasks yet
              </p>
              <p className="text-muted-foreground/40 text-xs mt-1">
                Add one above to get started
              </p>
            </div>
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

        {/* Completed tasks */}
        {showCompleted && completedTasks.length > 0 && (
          <div className="px-4 opacity-50">
            {completedTasks.map(task => (
              <SimpleTaskRow
                key={task.id}
                task={task}
                onComplete={() => {}}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
              />
            ))}
          </div>
        )}
      </div>

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
