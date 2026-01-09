import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProjects, Project } from '@/hooks/useProjects';
import { useDeleteTaskWithUndo } from '@/hooks/useDeleteTaskWithUndo';
import { ProjectSection } from '@/components/projects/ProjectSection';
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import { QuickAddInput } from '@/components/shared/QuickAddInput';
import { supabase } from '@/integrations/supabase/client';

const HomeTasks = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const { projects, createProject, updateProject, deleteProject, toggleCollapsed } = useProjects('home');
  const { deleteTaskWithUndo } = useDeleteTaskWithUndo();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const homeTasks = tasks?.filter(t => 
    t.category === 'home' && !t.completed
  ) || [];
  
  const completedTasks = tasks?.filter(t => 
    t.category === 'home' && t.completed
  ) || [];

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    const grouped: Record<string, Task[]> = { uncategorized: [] };
    
    projects.forEach(p => {
      grouped[p.id] = [];
    });
    
    homeTasks.forEach(task => {
      if (task.project_id && grouped[task.project_id]) {
        grouped[task.project_id].push(task);
      } else {
        grouped.uncategorized.push(task);
      }
    });
    
    return grouped;
  }, [homeTasks, projects]);

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

  // Instant add for project section inline inputs
  const handleAddTask = async (text: string, projectId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: text.trim(),
        raw_content: text.trim(),
        category: 'home',
        project_id: projectId,
        processing_status: 'pending',
      });
  };

  // Instant add for subtasks
  const handleAddSubtask = async (parentId: string, title: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const parentTask = tasks?.find(t => t.id === parentId);

    await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        raw_content: title.trim(),
        category: 'home',
        project_id: parentTask?.project_id || null,
        parent_task_id: parentId,
        processing_status: 'pending',
      });
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (task) {
      await deleteTaskWithUndo(task, tasks || []);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground font-medium">Home</span>
        <button 
          onClick={() => setShowNewProject(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 pt-4 pb-4">
        {/* Quick Add Input - always visible at top */}
        <QuickAddInput
          placeholder="Add a home task..."
          category="home"
        />
      </div>

      {/* Projects */}
      <div>
        {projects.map(project => (
          <ProjectSection
            key={project.id}
            project={project}
            tasks={tasksByProject[project.id] || []}
            allTasks={tasks || []}
            onToggleCollapse={() => toggleCollapsed(project.id)}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onAddSubtask={handleAddSubtask}
            onDeleteTask={handleDeleteTask}
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
          <p className="text-muted-foreground text-center py-12">No home tasks</p>
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

      {/* New project modal */}
      {showNewProject && (
        <NewProjectModal
          space="home"
          onClose={() => setShowNewProject(false)}
          onSave={handleCreateProject}
        />
      )}
    </div>
  );
};

export default HomeTasks;
