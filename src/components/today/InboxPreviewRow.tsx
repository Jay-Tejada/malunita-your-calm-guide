import { useState, memo } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Calendar, Moon, Trash2 } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { SwipeableEntry } from '@/components/mobile/SwipeableEntry';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { hapticLight } from '@/utils/haptics';

const TRUNCATE_LENGTH = 80;

interface InboxDualLayerState {
  displayText: string;
  rawContent: string;
  hasDualLayer: boolean;
  hasMoreContent: boolean;
}

function getInboxDualLayerDisplay(task: Task): InboxDualLayerState {
  const hasAiSummary = !!(task as any).ai_summary;
  const rawContent = (task as any).raw_content || task.title || '';
  
  // Use ai_summary if available, otherwise first line of raw_content
  let displayText = hasAiSummary 
    ? (task as any).ai_summary 
    : rawContent.split('\n')[0];
  
  // Truncate at ~80 chars
  const hasMoreContent = displayText.length > TRUNCATE_LENGTH || 
    (rawContent.length > displayText.length);
  
  if (displayText.length > TRUNCATE_LENGTH) {
    displayText = displayText.slice(0, TRUNCATE_LENGTH).trim() + '…';
  }
  
  const hasDualLayer = hasAiSummary || rawContent.length > TRUNCATE_LENGTH;
  
  return {
    displayText: displayText || 'Empty capture',
    rawContent,
    hasDualLayer,
    hasMoreContent,
  };
}

interface InboxPreviewRowProps {
  task: Task;
  onMoveToToday: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onMoveToWork?: (taskId: string) => void;
  onMoveToSomeday?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

export const InboxPreviewRow = memo(({ 
  task, 
  onMoveToToday, 
  onComplete,
  onMoveToWork,
  onMoveToSomeday,
  onDelete,
}: InboxPreviewRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    displayText,
    rawContent,
    hasDualLayer,
    hasMoreContent,
  } = getInboxDualLayerDisplay(task);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDualLayer) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleAction = (action: () => void) => {
    hapticLight();
    action();
    setIsOpen(false);
  };

  const handleSwipeComplete = () => {
    onMoveToToday(task.id);
  };

  const handleSwipeDelete = () => {
    if (onMoveToSomeday) {
      onMoveToSomeday(task.id);
    } else if (onDelete) {
      onDelete(task.id);
    }
  };

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors group",
        "bg-bg-surface hover:bg-bg-surface-2",
        "active:bg-bg-surface-2 active:scale-[0.99] transition-transform",
        isOpen && "bg-bg-surface-2"
      )}
    >
      {/* Task content - tappable for action menu */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div className="flex-1 min-w-0 cursor-pointer">
            {/* Primary display - ai_summary or truncated first line */}
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0 relative">
                <span 
                  className={cn(
                    "text-[13px] leading-relaxed text-text-secondary",
                    task.completed && "text-text-muted line-through"
                  )}
                >
                  {displayText}
                </span>
                
                {/* Expand indicator */}
                {hasMoreContent && (
                  <span className="text-text-muted ml-1">
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 inline" />
                    ) : (
                      <ChevronDown className="w-3 h-3 inline" />
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded state - show raw_content */}
            {isExpanded && hasDualLayer && (
              <div 
                className="mt-2 pt-2 border-t border-border-subtle"
                onClick={handleToggleExpand}
              >
                {/* Show ai_summary as header if it exists and differs from displayText */}
                {(task as any).ai_summary && (task as any).ai_summary !== displayText.replace('…', '') && (
                  <p className="text-[12px] font-medium text-text-muted mb-1.5">
                    {(task as any).ai_summary}
                  </p>
                )}
                
                {/* Original content */}
                <div 
                  className="text-[12px] text-text-muted leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap"
                >
                  {rawContent}
                </div>
              </div>
            )}
          </div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-48 bg-bg-surface border border-border-subtle text-text-secondary z-50">
          <DropdownMenuItem onClick={() => handleAction(() => onMoveToToday(task.id))}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Add to Today
          </DropdownMenuItem>
          
          {onMoveToWork && (
            <DropdownMenuItem onClick={() => handleAction(() => onMoveToWork(task.id))}>
              <Calendar className="w-4 h-4 mr-2" />
              Move to Work
            </DropdownMenuItem>
          )}
          
          {onMoveToSomeday && (
            <DropdownMenuItem onClick={() => handleAction(() => onMoveToSomeday(task.id))}>
              <Moon className="w-4 h-4 mr-2" />
              Someday
            </DropdownMenuItem>
          )}
          
          {hasDualLayer && (
            <DropdownMenuItem onClick={() => { setIsOpen(false); setIsExpanded(!isExpanded); }}>
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Expand
                </>
              )}
            </DropdownMenuItem>
          )}
          
          {onDelete && (
            <DropdownMenuItem 
              onClick={() => handleAction(() => onDelete(task.id))}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick action - Move to Today */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoveToToday(task.id);
        }}
        className={cn(
          "flex-shrink-0 p-1.5 rounded-md transition-all",
          "text-text-muted hover:text-text-secondary hover:bg-bg-surface-2",
          "opacity-0 group-hover:opacity-100"
        )}
        title="Add to Today"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <SwipeableEntry
      onComplete={handleSwipeComplete}
      onDelete={handleSwipeDelete}
    >
      {content}
    </SwipeableEntry>
  );
});

InboxPreviewRow.displayName = 'InboxPreviewRow';
