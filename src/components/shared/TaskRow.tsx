import { useState, memo } from "react";
import { Check, MoreHorizontal } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { useCompletionAnimation, CompletionContext } from "@/hooks/useCompletionAnimation";
import { DualLayerText } from "@/components/shared/DualLayerText";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  contextOverride?: CompletionContext;
}

export const TaskRow = memo(({ task, onComplete, onDelete, onEdit, contextOverride }: TaskRowProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { config, triggerHaptic } = useCompletionAnimation(contextOverride);

  const handleComplete = async () => {
    if (isCompleting) return;
    
    // Trigger context-aware haptic
    triggerHaptic(false);
    setIsCompleting(true);
    
    // Staggered animation sequence based on context
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete(task.id);
      }, config.totalBeforeComplete);
    }, config.rowExitDelay);
  };

  return (
    <div
      className={`flex items-start py-3 group transition-all ease-out overflow-hidden ${
        isExiting ? 'max-h-0 opacity-0' : 'max-h-[200px]'
      }`}
      style={{
        transitionDuration: isExiting ? `${config.collapseDuration}ms` : '300ms',
        transitionProperty: 'max-height, opacity, transform',
        transform: isCompleting && config.showSlide ? `translateY(${config.slideDistance}px)` : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox with context-aware animation */}
      <button
        onClick={handleComplete}
        disabled={isCompleting}
        className={`relative flex items-center justify-center w-5 h-5 border rounded-full bg-transparent transition-all flex-shrink-0 ${
          isCompleting 
            ? 'border-success bg-success' 
            : 'border-border-strong hover:border-accent-muted'
        }`}
        style={{
          transitionDuration: `${config.checkboxPulseDuration}ms`,
          transform: isCompleting ? `scale(${config.checkboxScale})` : 'scale(1)',
          animation: isCompleting ? `checkbox-pulse ${config.checkboxPulseDuration}ms ease-out` : 'none',
        }}
        aria-label="Complete task"
      >
        {/* Ripple effect - only shown based on context */}
        {isCompleting && config.showRipple && (
          <span 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              animation: 'checkbox-ripple 150ms ease-out forwards',
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)',
            }}
          />
        )}
        {isCompleting && (
          <Check 
            className="w-3 h-3 text-success-foreground" 
            style={{ animation: 'checkmark-draw 100ms ease-out' }} 
          />
        )}
      </button>

      {/* Task text with dual-layer display */}
      <div 
        className="flex-1 ml-3 transition-all ease-out"
        style={{
          transitionDuration: '120ms',
          transitionDelay: isCompleting ? `${config.textFadeDelay}ms` : '0ms',
          opacity: isCompleting ? config.rowFadeOpacity : 1,
        }}
      >
        <DualLayerText task={task} isCompleting={isCompleting} />
      </div>

      {/* Overflow menu */}
      <div className={`transition-opacity duration-200 ${isHovered && !isCompleting ? 'opacity-100' : 'opacity-0'}`}> 
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="text-text-muted hover:text-text-secondary hover:bg-bg-surface-2 rounded transition-colors p-1"
              aria-label="Task options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-bg-surface shadow-sm rounded-lg border border-border-subtle z-50"
          >
            <DropdownMenuItem
              onClick={() => onEdit(task.id)}
              className="font-mono text-sm text-text-secondary cursor-pointer hover:bg-bg-surface-2"
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="font-mono text-sm text-text-secondary cursor-pointer hover:bg-bg-surface-2"
            >
              Move
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="font-mono text-sm text-text-secondary cursor-pointer hover:bg-bg-surface-2"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

TaskRow.displayName = 'TaskRow';
