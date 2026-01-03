import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, ChevronDown, Plus, Trash2, Link2, Check } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { TaskLinkPreview } from '@/components/tasks/TaskLinkPreview';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
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

const SHORT_CONTENT_THRESHOLD = 50;

interface WorkDualLayerState {
  displayText: string;
  rawContent: string;
  rawPreview: string;
  hasDualLayer: boolean;
  showRawPreview: boolean;
}

function getWorkDualLayerDisplay(task: Task): WorkDualLayerState {
  const hasAiSummary = !!(task as any).ai_summary;
  const rawContent = (task as any).raw_content || task.title || '';
  
  const displayText = hasAiSummary 
    ? (task as any).ai_summary 
    : rawContent;
  
  const hasDualLayer = hasAiSummary && rawContent !== (task as any).ai_summary;
  const isShortContent = rawContent.length <= SHORT_CONTENT_THRESHOLD;
  const rawPreview = isShortContent 
    ? rawContent 
    : rawContent.split('\n')[0].slice(0, 80) + (rawContent.length > 80 ? '…' : '');
  const showRawPreview = hasDualLayer;
  
  return {
    displayText: displayText || 'Empty capture',
    rawContent,
    rawPreview,
    hasDualLayer,
    showRawPreview,
  };
}

interface WorkSortableTaskItemProps {
  task: Task;
  allTasks: Task[];
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, title: string) => void;
  onAddSubtask: (parentId: string, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  depth?: number;
}

export const WorkSortableTaskItem = ({ 
  task, 
  allTasks,
  onToggleTask, 
  onUpdateTask,
  onAddSubtask,
  onDeleteTask,
  depth = 0 
}: WorkSortableTaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(true);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskValue, setSubtaskValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const subtasks = allTasks.filter(t => t.parent_task_id === task.id && !t.completed);
  const hasSubtasks = subtasks.length > 0;

  const {
    displayText,
    rawContent,
    rawPreview,
    hasDualLayer,
    showRawPreview,
  } = getWorkDualLayerDisplay(task);

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

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleting) return;
    setIsCompleting(true);
    setTimeout(() => {
      onToggleTask(task.id);
    }, 200);
  };

  const handleContentExpand = () => {
    if (hasDualLayer && !isEditing) {
      setIsContentExpanded(!isContentExpanded);
    }
  };

  // Extract memory tags from ai_metadata
  const memoryTags = (task as any).ai_metadata?.memory_tags || [];

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-foreground/5 pl-2' : ''}>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-start gap-2 py-2.5 px-2 group relative rounded-md transition-colors",
          isDragging 
            ? 'opacity-50 bg-primary/5 shadow-sm z-10' 
            : 'hover:bg-foreground/[0.03]',
          hasDualLayer && !isEditing && 'cursor-pointer'
        )}
        onClick={handleContentExpand}
      >
        {/* Expand/collapse for subtasks */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSubtasksExpanded(!isSubtasksExpanded);
          }}
          className={cn(
            "p-0.5 -ml-1 text-foreground/30 hover:text-foreground/50 transition-opacity",
            hasSubtasks ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {isSubtasksExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
            isCompleting
              ? "bg-success/80 border border-success"
              : "border border-foreground/20 hover:border-foreground/40"
          )}
        >
          {isCompleting && (
            <Check className="w-2.5 h-2.5 text-success-foreground" />
          )}
        </button>

        {/* Content area with Work-specific dual layer */}
        <div className="flex-1 min-w-0 space-y-1">
          {isEditing ? (
            <input
              ref={editInputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleEditKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-sm text-foreground focus:outline-none border-b border-primary/50"
            />
          ) : (
            <>
              {/* Primary display - ai_summary, full */}
              <span
                onClick={handleTitleClick}
                className={cn(
                  "text-sm leading-relaxed cursor-text hover:text-foreground transition-colors block",
                  isCompleting ? "text-foreground/40 line-through" : "text-foreground/80"
                )}
              >
                {displayText}
              </span>

              {/* Raw content preview - 1 line, muted */}
              {showRawPreview && !isContentExpanded && (
                <p className="text-[12px] text-foreground/40 leading-snug truncate">
                  {rawPreview}
                </p>
              )}

              {/* Expand indicator */}
              {hasDualLayer && !isContentExpanded && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground/40">More</span>
                </div>
              )}

              {/* Expanded raw content */}
              {isContentExpanded && hasDualLayer && (
                <div 
                  className="mt-1.5 pt-1.5 border-t border-border/10 animate-fade-in"
                  style={{ animationDuration: '100ms' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[12px] text-foreground/50 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {rawContent}
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsContentExpanded(false);
                    }}
                    className="flex items-center gap-0.5 mt-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
                  >
                    <ChevronDown className="w-2.5 h-2.5 rotate-180" />
                    Less
                  </button>
                </div>
              )}

              {/* Context chips */}
              {memoryTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {memoryTags.slice(0, 2).map((tag: string, idx: number) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-primary/10 text-primary/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Link preview */}
          {task.link_url && (
            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
              <TaskLinkPreview url={task.link_url} onRemove={handleRemoveLink} onUpdate={handleUpdateLink} />
            </div>
          )}
        </div>

        {/* Add link button */}
        {!task.link_url && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLinkInput(true);
            }}
            className="p-1 opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-primary transition-opacity"
            title="Add link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Add subtask button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSubtaskInput(true);
          }}
          className="p-1 opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-foreground/50 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="p-1 opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-destructive transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
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
              This will permanently delete "{displayText.slice(0, 50)}..."{hasSubtasks ? ' and all its subtasks' : ''}. This action cannot be undone.
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

      {/* Subtask input */}
      {showSubtaskInput && (
        <div className="ml-6 border-l border-foreground/5 pl-2 py-1.5">
          <div className="flex items-center gap-2">
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
      {isSubtasksExpanded && hasSubtasks && (
        <div>
          {subtasks.map(subtask => (
            <WorkSortableTaskItem
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
