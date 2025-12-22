import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, ChevronDown, Plus, Trash2, Link2 } from 'lucide-react';
import { Task, useTasks } from '@/hooks/useTasks';
import { TaskLinkPreview } from '@/components/tasks/TaskLinkPreview';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SortableTaskItemProps {
  task: Task;
  allTasks: Task[];
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, title: string) => void;
  onAddSubtask: (parentId: string, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  depth?: number;
}

export const SortableTaskItem = ({ 
  task, 
  allTasks,
  onToggleTask, 
  onUpdateTask,
  onAddSubtask,
  onDeleteTask,
  depth = 0 
}: SortableTaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskValue, setSubtaskValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const subtasks = allTasks.filter(t => t.parent_task_id === task.id && !t.completed);
  const hasSubtasks = subtasks.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  };

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (showSubtaskInput && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
    }
  }, [showSubtaskInput]);

  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkInput]);

  const handleTitleClick = () => {
    setIsEditing(true);
    setEditValue(task.title);
  };

  const handleEditSave = () => {
    if (editValue.trim() && editValue.trim() !== task.title) {
      onUpdateTask(task.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setEditValue(task.title);
      setIsEditing(false);
    }
  };

  const handleAddSubtask = () => {
    if (subtaskValue.trim()) {
      onAddSubtask(task.id, subtaskValue.trim());
      setSubtaskValue('');
    }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setSubtaskValue('');
      setShowSubtaskInput(false);
    }
  };

  const handleAddLink = async () => {
    let url = linkValue.trim();
    if (!url) return;
    
    // Add https:// if no protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    await supabase.from('tasks').update({ link_url: url }).eq('id', task.id);
    setLinkValue('');
    setShowLinkInput(false);
  };

  const handleRemoveLink = async () => {
    await supabase.from('tasks').update({ link_url: null }).eq('id', task.id);
  };

  const handleUpdateLink = async (newUrl: string) => {
    await supabase.from('tasks').update({ link_url: newUrl }).eq('id', task.id);
  };

  const handleLinkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddLink();
    } else if (e.key === 'Escape') {
      setLinkValue('');
      setShowLinkInput(false);
    }
  };

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-foreground/5 pl-2' : ''}>
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-start gap-2 py-1.5 group relative ${
          isDragging 
            ? 'opacity-50 bg-primary/5 rounded-md shadow-sm z-10' 
            : 'hover:bg-foreground/[0.02]'
        }`}
      >
        {/* Expand/collapse for subtasks */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-0.5 -ml-1 text-foreground/30 hover:text-foreground/50 transition-opacity ${
            hasSubtasks ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onToggleTask(task.id)}
          className="w-4 h-4 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0 mt-0.5"
        />

        {/* Title and link - content area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={editInputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleEditKeyDown}
              className="w-full bg-transparent text-sm text-foreground focus:outline-none border-b border-primary/50"
            />
          ) : (
            <span
              onClick={handleTitleClick}
              className="text-sm text-foreground/70 cursor-text hover:text-foreground transition-colors"
            >
              {task.title}
            </span>
          )}
          
          {/* Link preview */}
          {task.link_url && (
            <div className="mt-1">
              <TaskLinkPreview url={task.link_url} onRemove={handleRemoveLink} onUpdate={handleUpdateLink} />
            </div>
          )}
        </div>

        {/* Add link button */}
        {!task.link_url && (
          <button
            onClick={() => setShowLinkInput(true)}
            className="p-1 opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-primary transition-opacity"
            title="Add link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Add subtask button */}
        <button
          onClick={() => setShowSubtaskInput(true)}
          className="p-1 opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-foreground/50 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Delete button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-1 opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-destructive transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Drag handle - right side */}
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-foreground/50 transition-opacity touch-none"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Link input */}
      {showLinkInput && (
        <div className="ml-6 py-1.5">
          <div className="flex items-center gap-2">
            <div className="w-[38px] flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1 px-2 py-1 rounded-md bg-primary/5 border border-primary/20">
              <Link2 className="w-3.5 h-3.5 text-primary/60" />
              <input
                ref={linkInputRef}
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                onBlur={() => {
                  if (!linkValue.trim()) setShowLinkInput(false);
                }}
                onKeyDown={handleLinkKeyDown}
                placeholder="Paste URL..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{task.title}"{hasSubtasks ? ' and all its subtasks' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDeleteTask(task.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subtask input - aligned with subtasks */}
      {showSubtaskInput && (
        <div className="ml-6 border-l border-foreground/5 pl-2 py-1.5">
          <div className="flex items-center gap-2">
            {/* Spacer to align with task title (chevron + checkbox space) */}
            <div className="w-[38px] flex-shrink-0" />
            <input
              ref={subtaskInputRef}
              value={subtaskValue}
              onChange={(e) => setSubtaskValue(e.target.value)}
              onBlur={() => {
                if (!subtaskValue.trim()) setShowSubtaskInput(false);
              }}
              onKeyDown={handleSubtaskKeyDown}
              placeholder="Add subtask..."
              className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Render subtasks */}
      {isExpanded && hasSubtasks && (
        <div>
          {subtasks.map(subtask => (
            <SortableTaskItem
              key={subtask.id}
              task={subtask}
              allTasks={allTasks}
              onToggleTask={onToggleTask}
              onUpdateTask={onUpdateTask}
              onAddSubtask={onAddSubtask}
              onDeleteTask={onDeleteTask}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
