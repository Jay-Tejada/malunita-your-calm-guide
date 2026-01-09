import { useState, memo } from 'react';
import { Check, MoreHorizontal } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { useCompletionAnimation, CompletionContext } from '@/hooks/useCompletionAnimation';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SimpleTaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  contextOverride?: CompletionContext;
}

/**
 * Todoist-style minimal task row: checkbox + single line of text.
 * No expand indicators, no metadata, no visual clutter.
 */
export const SimpleTaskRow = memo(({ 
  task, 
  onComplete, 
  onDelete, 
  onEdit, 
  contextOverride 
}: SimpleTaskRowProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { config, triggerHaptic } = useCompletionAnimation(contextOverride);

  // Simple display: prefer ai_summary, fallback to title
  const displayText = (task as any).ai_summary || task.title || 'Empty task';
  
  // Is this a pending voice note?
  const isPending = (task as any).processing_status === 'pending' || 
                   (task as any).processing_status === 'processing';

  const handleComplete = async () => {
    if (isCompleting) return;
    
    triggerHaptic(false);
    setIsCompleting(true);
    
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete(task.id);
      }, config.totalBeforeComplete);
    }, config.rowExitDelay);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2.5 group transition-all ease-out overflow-hidden",
        isExiting ? 'max-h-0 opacity-0 py-0' : 'max-h-16'
      )}
      style={{
        transitionDuration: isExiting ? `${config.collapseDuration}ms` : '200ms',
        transitionProperty: 'max-height, opacity, padding',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <button
        onClick={handleComplete}
        disabled={isCompleting}
        className={cn(
          "relative flex items-center justify-center w-[18px] h-[18px] rounded-full border transition-all flex-shrink-0",
          isCompleting 
            ? "border-success bg-success" 
            : "border-muted-foreground/30 hover:border-muted-foreground/50 bg-transparent"
        )}
        style={{
          transform: isCompleting ? 'scale(1.1)' : 'scale(1)',
          transitionDuration: '150ms',
        }}
        aria-label="Complete task"
      >
        {isCompleting && (
          <Check className="w-2.5 h-2.5 text-success-foreground" />
        )}
      </button>

      {/* Task text - single line, uniform styling */}
      <span 
        className={cn(
          "flex-1 text-sm leading-normal truncate transition-colors",
          isCompleting 
            ? "text-muted-foreground line-through" 
            : isPending 
              ? "text-muted-foreground italic"
              : "text-foreground"
        )}
        style={{
          transitionDuration: '100ms',
        }}
      >
        {isPending ? 'Voice note added…' : displayText}
      </span>

      {/* Overflow menu - only visible on hover */}
      <div 
        className={cn(
          "transition-opacity duration-150 flex-shrink-0",
          isHovered && !isCompleting ? 'opacity-100' : 'opacity-0'
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
              aria-label="Task options"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-background border border-border rounded-lg shadow-md z-50"
          >
            <DropdownMenuItem
              onClick={() => onEdit(task.id)}
              className="text-sm cursor-pointer"
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-sm cursor-pointer"
            >
              Move
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-sm text-destructive cursor-pointer"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

SimpleTaskRow.displayName = 'SimpleTaskRow';
