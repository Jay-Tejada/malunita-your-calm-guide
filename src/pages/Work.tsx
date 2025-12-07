import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProjects, Project } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { MobileTaskCapture } from '@/components/shared/MobileTaskCapture';
import { DesktopTaskCapture } from '@/components/shared/DesktopTaskCapture';
import { ProjectSection } from '@/components/projects/ProjectSection';
import { NewProjectModal } from '@/components/projects/NewProjectModal';

const Work = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const { projects, createProject, updateProject, deleteProject, toggleCollapsed } = useProjects('work');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 'q' key focuses the input for quick capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'q' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const workTasks = tasks?.filter(t => 
    t.category === 'work' && !t.completed
  ) || [];
  
  const completedTasks = tasks?.filter(t => 
    t.category === 'work' && t.completed
  ) || [];

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    const grouped: Record<string, Task[]> = { uncategorized: [] };
    
    projects.forEach(p => {
      grouped[p.id] = [];
    });
    
    workTasks.forEach(task => {
      if (task.project_id && grouped[task.project_id]) {
        grouped[task.project_id].push(task);
      } else {
        grouped.uncategorized.push(task);
      }
    });
    
    return grouped;
  }, [workTasks, projects]);

  const handleCapture = async (text: string, projectId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('tasks').insert({
      user_id: user.id,
      title: text,
      category: 'work',
      project_id: projectId || null
    });
  };

  const handleCreateProject = async (project: { name: string; space: string; icon?: string; color?: string }) => {
    await createProject(project);
    setShowNewProject(false);
  };

  const handleToggleTask = (taskId: string) => {
    updateTask({ id: taskId, updates: { completed: true } });
  };

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
        {/* Desktop capture input */}
        <div className="px-4 pt-4">
          <DesktopTaskCapture 
            ref={inputRef}
            placeholder="Add a work task..." 
            onCapture={handleCapture} 
          />
        </div>

        {/* Projects */}
        <div className="mt-4">
          {projects.map(project => (
            <ProjectSection
              key={project.id}
              project={project}
              tasks={tasksByProject[project.id] || []}
              onToggleCollapse={() => toggleCollapsed(project.id)}
              onToggleTask={handleToggleTask}
              onAddTask={(text, projectId) => handleCapture(text, projectId)}
              onEditProject={setEditingProject}
              onDeleteProject={deleteProject}
            />
          ))}

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
      
      {/* Mobile capture input */}
      <MobileTaskCapture 
        placeholder="Add a work task..." 
        onCapture={handleCapture} 
      />

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
