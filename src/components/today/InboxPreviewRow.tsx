import { useState, memo } from 'react';
import { ChevronDown, ArrowRight, Inbox } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

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
}

export const InboxPreviewRow = memo(({ task, onMoveToToday, onComplete }: InboxPreviewRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
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

  const handleMoveToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveToToday(task.id);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors group",
        "bg-muted/30 hover:bg-muted/50",
        hasDualLayer && "cursor-pointer"
      )}
      onClick={handleToggleExpand}
    >
      {/* Inbox indicator - subtle */}
      <div className="flex-shrink-0 mt-0.5">
        <Inbox className="w-3.5 h-3.5 text-muted-foreground/50" />
      </div>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        {/* Primary display - ai_summary or truncated first line */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 relative">
            <span 
              className={cn(
                "text-[13px] leading-relaxed text-foreground/70",
                task.completed && "text-foreground/40 line-through"
              )}
            >
              {displayText}
            </span>
            
            {/* Fade effect for truncated content */}
            {hasMoreContent && !isExpanded && (
              <span className="text-muted-foreground/40 ml-1">
                <ChevronDown className="w-3 h-3 inline" />
              </span>
            )}
          </div>
        </div>

        {/* Expanded state - show raw_content */}
        {isExpanded && hasDualLayer && (
          <div className="mt-2 pt-2 border-t border-border/30">
            {/* Show ai_summary as header if it exists and differs from displayText */}
            {(task as any).ai_summary && (task as any).ai_summary !== displayText.replace('…', '') && (
              <p className="text-[12px] font-medium text-foreground/60 mb-1.5">
                {(task as any).ai_summary}
              </p>
            )}
            
            {/* Original content */}
            <div 
              className="text-[12px] text-foreground/50 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap"
            >
              {rawContent}
            </div>
          </div>
        )}
      </div>

      {/* Move to Today action */}
      <button
        onClick={handleMoveToToday}
        className={cn(
          "flex-shrink-0 p-1.5 rounded-md transition-all",
          "text-muted-foreground/40 hover:text-foreground hover:bg-muted",
          "opacity-0 group-hover:opacity-100"
        )}
        title="Add to Today"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
});

InboxPreviewRow.displayName = 'InboxPreviewRow';
