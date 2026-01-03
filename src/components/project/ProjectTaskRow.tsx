import { useState, memo } from 'react';
import { ChevronDown, ChevronRight, Check, Circle, AlertCircle, Plus } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed';

interface ProjectDualLayerState {
  displayText: string;
  rawContent: string;
  hasDualLayer: boolean;
  status: TaskStatus;
}

function getProjectDualLayerDisplay(task: Task): ProjectDualLayerState {
  const hasAiSummary = !!(task as any).ai_summary;
  const rawContent = (task as any).raw_content || task.title || '';
  
  const displayText = hasAiSummary 
    ? (task as any).ai_summary 
    : rawContent;
  
  const hasDualLayer = hasAiSummary && rawContent !== (task as any).ai_summary;
  
  // Determine status based on task metadata
  let status: TaskStatus = 'not_started';
  if (task.completed) {
    status = 'completed';
  } else if (task.is_focus) {
    status = 'in_progress';
  } else if ((task as any).ai_metadata?.blocked) {
    status = 'blocked';
  }
  
  return {
    displayText: displayText || 'Empty task',
    rawContent,
    hasDualLayer,
    status,
  };
}

interface ProjectTaskRowProps {
  task: Task;
  relatedTasks?: Task[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  depth?: number;
}

export const ProjectTaskRow = memo(({ 
  task, 
  relatedTasks = [],
  onToggle, 
  onEdit,
  depth = 0,
}: ProjectTaskRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const {
    displayText,
    rawContent,
    hasDualLayer,
    status,
  } = getProjectDualLayerDisplay(task);

  const handleToggleExpand = () => {
    if (hasDualLayer || relatedTasks.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleting) return;
    setIsCompleting(true);
    setTimeout(() => {
      onToggle(task.id);
    }, 200);
  };

  const StatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Check className="w-3 h-3 text-emerald-500" />;
      case 'in_progress':
        return <Circle className="w-3 h-3 text-primary fill-primary/30" />;
      case 'blocked':
        return <AlertCircle className="w-3 h-3 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "group",
        depth > 0 && "ml-4 pl-3 border-l border-border/20"
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2.5 py-2.5 px-2 rounded-md transition-colors",
          "hover:bg-muted/20",
          (hasDualLayer || relatedTasks.length > 0) && "cursor-pointer"
        )}
        onClick={handleToggleExpand}
      >
        {/* Checkbox with status */}
        <button
          onClick={handleComplete}
          className={cn(
            "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 transition-all",
            isCompleting || status === 'completed'
              ? "bg-emerald-500/80 border border-emerald-500"
              : status === 'in_progress'
              ? "border-2 border-primary"
              : status === 'blocked'
              ? "border-2 border-amber-500"
              : "border border-foreground/20 hover:border-foreground/40"
          )}
        >
          {(isCompleting || status === 'completed') && (
            <Check className="w-2.5 h-2.5 text-success-foreground" />
          )}
        </button>

        {/* Status indicator */}
        {status !== 'not_started' && status !== 'completed' && (
          <div className="flex-shrink-0 mt-1">
            <StatusIcon />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Primary display - ai_summary */}
          <p 
            className={cn(
              "text-[13px] leading-relaxed",
              status === 'completed' 
                ? "text-foreground/40 line-through" 
                : "text-foreground/80"
            )}
          >
            {displayText}
          </p>

          {/* Expand indicator */}
          {(hasDualLayer || relatedTasks.length > 0) && !isExpanded && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground/40">
                {relatedTasks.length > 0 ? `${relatedTasks.length} related` : 'Details'}
              </span>
            </div>
          )}

          {/* Expanded state */}
          {isExpanded && (
            <div 
              className="mt-2 space-y-3 animate-fade-in"
              style={{ animationDuration: '120ms' }}
            >
              {/* Raw content */}
              {hasDualLayer && (
                <div className="pt-2 border-t border-border/10">
                  <p className="text-[12px] text-foreground/50 leading-relaxed whitespace-pre-wrap">
                    {rawContent}
                  </p>
                </div>
              )}

              {/* Related tasks */}
              {relatedTasks.length > 0 && (
                <div className="pt-2 border-t border-border/10 space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground/40 mb-2">
                    Related
                  </p>
                  {relatedTasks.map(related => (
                    <div 
                      key={related.id}
                      className="flex items-center gap-2 text-[11px] text-foreground/50 py-1"
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        related.completed ? "bg-emerald-500/50" : "border border-foreground/20"
                      )} />
                      <span className={related.completed ? "line-through" : ""}>
                        {(related as any).ai_summary || related.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Collapse */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
              >
                <ChevronDown className="w-2.5 h-2.5 rotate-180" />
                Less
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProjectTaskRow.displayName = 'ProjectTaskRow';

// Project header with progress
interface ProjectHeaderProps {
  name: string;
  icon?: string;
  totalTasks: number;
  completedTasks: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddTask: () => void;
}

export const ProjectHeader = memo(({
  name,
  icon,
  totalTasks,
  completedTasks,
  isCollapsed,
  onToggleCollapse,
  onAddTask,
}: ProjectHeaderProps) => {
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3 py-3 px-2 group">
      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="flex items-center gap-2 flex-1 text-left"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
        )}
        
        {/* Icon */}
        <span className="text-base">{icon || '📁'}</span>
        
        {/* Name */}
        <span className="font-medium text-sm text-foreground/80">
          {name}
        </span>
      </button>

      {/* Progress hint */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground/50">
          {completedTasks} of {totalTasks}
        </span>
        
        {/* Mini progress bar */}
        <div className="w-12 h-1 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary/60 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Add task */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddTask();
        }}
        className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-foreground/60 transition-opacity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
});

ProjectHeader.displayName = 'ProjectHeader';
