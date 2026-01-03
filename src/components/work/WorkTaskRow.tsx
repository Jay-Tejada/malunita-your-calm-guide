import { useState, memo } from 'react';
import { Check, ChevronDown, MoreHorizontal } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SHORT_CONTENT_THRESHOLD = 50;

interface WorkDualLayerState {
  displayText: string;
  rawContent: string;
  rawPreview: string;
  hasDualLayer: boolean;
  showRawPreview: boolean;
  projectName: string | null;
}

function getWorkDualLayerDisplay(task: Task, projectName?: string): WorkDualLayerState {
  const hasAiSummary = !!(task as any).ai_summary;
  const rawContent = (task as any).raw_content || task.title || '';
  
  // Work view: full ai_summary, no truncation
  const displayText = hasAiSummary 
    ? (task as any).ai_summary 
    : rawContent;
  
  const hasDualLayer = hasAiSummary && rawContent !== (task as any).ai_summary;
  
  // Show 1-line preview of raw_content if it exists and differs
  // If raw_content is short (<50 chars), show full inline
  const isShortContent = rawContent.length <= SHORT_CONTENT_THRESHOLD;
  const rawPreview = isShortContent 
    ? rawContent 
    : rawContent.split('\n')[0].slice(0, 80) + (rawContent.length > 80 ? '…' : '');
  
  // Only show preview if has dual layer
  const showRawPreview = hasDualLayer;
  
  return {
    displayText: displayText || 'Empty capture',
    rawContent,
    rawPreview,
    hasDualLayer,
    showRawPreview,
    projectName: projectName || null,
  };
}

interface WorkTaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  projectName?: string;
  contextChips?: string[];
}

export const WorkTaskRow = memo(({ 
  task, 
  onComplete, 
  onDelete, 
  onEdit,
  projectName,
  contextChips = [],
}: WorkTaskRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const {
    displayText,
    rawContent,
    rawPreview,
    hasDualLayer,
    showRawPreview,
  } = getWorkDualLayerDisplay(task, projectName);

  const handleComplete = () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setTimeout(() => {
      onComplete(task.id);
    }, 200);
  };

  const handleToggleExpand = () => {
    if (hasDualLayer) {
      setIsExpanded(!isExpanded);
    }
  };

  // Extract memory tags from ai_metadata if available
  const memoryTags = (task as any).ai_metadata?.memory_tags || contextChips;

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3 px-3 rounded-lg transition-colors group",
        "bg-bg-surface hover:bg-bg-surface-2",
        hasDualLayer && "cursor-pointer"
      )}
      onClick={handleToggleExpand}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox - functional but not dominant */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleComplete();
        }}
        className={cn(
          "flex-shrink-0 w-4.5 h-4.5 rounded-full flex items-center justify-center mt-1 transition-all border",
          isCompleting
            ? "bg-success border-success"
            : "bg-transparent border-border-strong hover:border-accent-muted"
        )}
      >
        {isCompleting && (
          <Check className="w-2.5 h-2.5 text-success-foreground" />
        )}
      </button>

      {/* Task content with breathing room */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Primary display - ai_summary, full */}
        <p 
          className={cn(
            "text-[14px] leading-relaxed",
            isCompleting
              ? "text-foreground/40 line-through" 
              : "text-foreground/90"
          )}
        >
          {displayText}
        </p>

        {/* Raw content preview - 1 line, muted */}
        {showRawPreview && !isExpanded && (
          <p className="text-[13px] text-foreground/40 leading-snug truncate">
            {rawPreview}
          </p>
        )}

        {/* Expand indicator */}
        {hasDualLayer && !isExpanded && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronDown className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/40">More</span>
          </div>
        )}

        {/* Expanded state - full raw_content */}
        {isExpanded && hasDualLayer && (
          <div 
            className="mt-2 pt-2 border-t border-border/10 animate-fade-in space-y-2"
            style={{ animationDuration: '120ms' }}
          >
            <p className="text-[13px] text-foreground/50 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {rawContent}
            </p>
            
            {/* Collapse button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
            >
              <ChevronDown className="w-3 h-3 rotate-180" />
              Less
            </button>
          </div>
        )}

        {/* Context chips - project/theme associations */}
        {memoryTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {memoryTags.slice(0, 3).map((tag: string, idx: number) => (
              <span 
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Overflow menu */}
      <div 
        className={cn(
          "transition-opacity duration-200",
          isHovered && !isCompleting ? 'opacity-100' : 'opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="text-foreground/20 hover:text-foreground/40 transition-colors p-1"
              aria-label="Task options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-background shadow-sm rounded-lg border border-foreground/10 z-50"
          >
            <DropdownMenuItem
              onClick={() => onEdit(task.id)}
              className="font-mono text-sm text-foreground/80 cursor-pointer hover:bg-foreground/5"
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="font-mono text-sm text-foreground/80 cursor-pointer hover:bg-foreground/5"
            >
              Move
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="font-mono text-sm text-foreground/80 cursor-pointer hover:bg-foreground/5"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

WorkTaskRow.displayName = 'WorkTaskRow';
