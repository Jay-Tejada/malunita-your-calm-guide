import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useDeleteTaskWithUndo } from '@/hooks/useDeleteTaskWithUndo';
import { QuickAddInput, QuickAddInputRef } from '@/components/shared/QuickAddInput';
import { SimpleTaskRow } from '@/components/shared/SimpleTaskRow';
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import { deduplicateTasks } from '@/utils/duplicateDetection';

const Work = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('project');
  
  const { tasks, updateTask } = useTasks();
  const { projects, createProject } = useProjects('work');
  const { deleteTaskWithUndo } = useDeleteTaskWithUndo();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const inputRef = useRef<QuickAddInputRef>(null);

  // Find selected project if any
  const selectedProject = useMemo(() => 
    selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null,
    [selectedProjectId, projects]
  );

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
  
  // All work tasks (incomplete) - deduplicated, filtered by project if selected
  const workTasks = useMemo(() => {
    let filtered = (tasks || []).filter(t => t.category === 'work' && !t.completed);
    
    // If a specific project is selected, only show that project's tasks
    if (selectedProjectId) {
      filtered = filtered.filter(t => t.project_id === selectedProjectId);
    }
    
    return deduplicateTasks(filtered);
  }, [tasks, selectedProjectId]);
  
  // Completed work tasks (filtered by project if selected)
  const completedTasks = useMemo(() => {
    let filtered = (tasks || []).filter(t => t.category === 'work' && t.completed);
    if (selectedProjectId) {
      filtered = filtered.filter(t => t.project_id === selectedProjectId);
    }
    return filtered;
  }, [tasks, selectedProjectId]);

  // Sort tasks by display_order
  const sortedTasks = useMemo(() => 
    [...workTasks].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [workTasks]
  );

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

  // Page title
  const pageTitle = selectedProject ? selectedProject.name : 'Work';

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border md:border-b-0">
        <button 
          onClick={() => selectedProjectId ? navigate('/work') : navigate('/')} 
          className="text-muted-foreground hover:text-foreground transition-colors md:hidden"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-lg text-foreground md:text-xl">{pageTitle}</span>
        <button 
          onClick={() => setShowNewProject(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="New project"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="pb-24 md:pb-4">
        {/* Quick Add Input */}
        <div className="px-4 pt-4 pb-2">
          <QuickAddInput 
            ref={inputRef}
            placeholder={selectedProject ? `Add to ${selectedProject.name}...` : "Add a work task..."} 
            category="work"
            project_id={selectedProjectId || undefined}
          />
        </div>

        {/* Task list - flat, simple */}
        <div className="mt-2 px-4">
          {sortedTasks.length > 0 ? (
            <div className="space-y-0">
              {sortedTasks.map(task => (
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
            <div className="text-center py-16">
              <p className="text-muted-foreground/60 text-sm">
                No tasks yet
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
