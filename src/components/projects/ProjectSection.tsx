import { useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { Task } from '@/hooks/useTasks';
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
}

export const ProjectSection = ({
  project,
  tasks,
  onToggleCollapse,
  onToggleTask,
  onAddTask,
  onEditProject,
  onDeleteProject
}: ProjectSectionProps) => {
  const [inputValue, setInputValue] = useState('');
  const incompleteTasks = tasks.filter(t => !t.completed);
  const isCollapsed = project.is_collapsed;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddTask(inputValue.trim(), project.id);
      setInputValue('');
    }
  };

  return (
    <div className="border-b border-foreground/5">
      {/* Project header */}
      <div className="flex items-center gap-2 px-4 py-3 hover:bg-foreground/[0.02] group">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-3 flex-1 text-left"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-foreground/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-foreground/30" />
          )}
          <span className="font-mono text-sm text-foreground/70">
            {project.icon && <span className="mr-2">{project.icon}</span>}
            {project.name}
          </span>
        </button>
        
        <span className="text-xs text-foreground/30 mr-2">
          {incompleteTasks.length}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-foreground/50 transition-opacity">
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
      
      {/* Project tasks */}
      {!isCollapsed && (
        <div className="pl-11 pr-4 pb-3">
          {incompleteTasks.length === 0 ? (
            <p className="text-xs text-foreground/30 py-2">No tasks</p>
          ) : (
            incompleteTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 py-2">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="w-4 h-4 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0 mt-0.5"
                />
                <span className="font-mono text-sm text-foreground/70">{task.title}</span>
              </div>
            ))
          )}
          
          {/* Add task to project */}
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add task..."
            className="w-full bg-transparent font-mono text-xs text-foreground/50 placeholder:text-foreground/20 focus:outline-none py-2 mt-1"
          />
        </div>
      )}
    </div>
  );
};
