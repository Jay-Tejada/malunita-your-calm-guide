import { useState, memo, useEffect, useRef } from 'react';
import { Check, ChevronDown, AlertCircle } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

const TODAY_TRUNCATE_LENGTH = 60;
const TODAY_CONFIDENCE_THRESHOLD = 0.7;
const AUTO_COLLAPSE_DELAY = 5000;

interface TodayDualLayerState {
  displayText: string;
  rawContent: string;
  hasDualLayer: boolean;
  needsReview: boolean;
  confidence: number;
}

function getTodayDualLayerDisplay(task: Task): TodayDualLayerState {
  const hasAiSummary = !!(task as any).ai_summary;
  const confidence = (task as any).ai_confidence ?? 1.0;
  const needsReview = confidence < TODAY_CONFIDENCE_THRESHOLD;
  const rawContent = (task as any).raw_content || task.title || '';
  
  // Today always uses ai_summary if available, truncated
  let displayText = hasAiSummary 
    ? (task as any).ai_summary 
    : rawContent;
  
  // Truncate at ~60 chars for Today view
  if (displayText.length > TODAY_TRUNCATE_LENGTH) {
    displayText = displayText.slice(0, TODAY_TRUNCATE_LENGTH).trim() + '…';
  }
  
  const hasDualLayer = hasAiSummary && rawContent !== (task as any).ai_summary;
  
  return {
    displayText: displayText || 'Empty capture',
    rawContent,
    hasDualLayer,
    needsReview,
    confidence,
  };
}

interface TodayTaskRowProps {
  task: Task;
  onToggle: (taskId: string, completed: boolean) => void;
}

export const TodayTaskRow = memo(({ task, onToggle }: TodayTaskRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const autoCollapseTimer = useRef<NodeJS.Timeout | null>(null);
  
  const {
    displayText,
    rawContent,
    hasDualLayer,
    needsReview,
  } = getTodayDualLayerDisplay(task);

  // Auto-collapse after 5 seconds of no interaction
  useEffect(() => {
    if (isExpanded) {
      autoCollapseTimer.current = setTimeout(() => {
        setIsExpanded(false);
      }, AUTO_COLLAPSE_DELAY);
    }
    
    return () => {
      if (autoCollapseTimer.current) {
        clearTimeout(autoCollapseTimer.current);
      }
    };
  }, [isExpanded]);

  const resetAutoCollapse = () => {
    if (autoCollapseTimer.current) {
      clearTimeout(autoCollapseTimer.current);
      autoCollapseTimer.current = setTimeout(() => {
        setIsExpanded(false);
      }, AUTO_COLLAPSE_DELAY);
    }
  };

  const handleToggleExpand = () => {
    if (hasDualLayer) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(task.id, task.completed || false);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-md transition-colors group",
        "bg-bg-surface hover:bg-bg-surface-2",
        hasDualLayer && "cursor-pointer"
      )}
      onClick={handleToggleExpand}
      onMouseMove={isExpanded ? resetAutoCollapse : undefined}
    >
      {/* Prominent checkbox */}
      <button
        onClick={handleCheckboxClick}
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all",
          task.completed
            ? "bg-foreground/10 border border-foreground/20"
            : "bg-transparent border-2 border-foreground/30 hover:border-foreground/50 hover:scale-110"
        )}
      >
        {task.completed && (
          <Check className="w-3 h-3 text-foreground/60" />
        )}
      </button>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        {/* Primary display - ai_summary, high contrast */}
        <div className="flex items-center gap-2">
          <span 
            className={cn(
              "text-[14px] leading-tight font-medium",
              task.completed 
                ? "text-foreground/40 line-through" 
                : "text-foreground"
            )}
          >
            {displayText}
          </span>
          
          {/* Needs review indicator */}
          {needsReview && !task.completed && (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500/60 flex-shrink-0" />
          )}
          
          {/* Expand indicator - subtle */}
          {hasDualLayer && !isExpanded && !task.completed && (
            <ChevronDown className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {/* Expanded state - minimal */}
        {isExpanded && hasDualLayer && (
          <div 
            className="mt-2 animate-fade-in"
            style={{ animationDuration: '100ms' }}
          >
            <p 
              className="text-[13px] text-foreground/40 leading-snug line-clamp-4 overflow-y-auto"
              style={{ maxHeight: '4.5em' }}
            >
              {rawContent}
            </p>
            
            {/* Collapse hint */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="mt-1.5 text-xs text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
            >
              <ChevronDown className="w-3 h-3 rotate-180 inline mr-0.5" />
              less
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

TodayTaskRow.displayName = 'TodayTaskRow';
