import { useState, memo } from 'react';
import { ChevronDown, Sparkles, Clock, Trash2 } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SomedayDualLayerState {
  displayText: string;
  rawContent: string;
  hasDualLayer: boolean;
  age: string;
}

function getSomedayDualLayerDisplay(task: Task): SomedayDualLayerState {
  const hasAiSummary = !!(task as any).ai_summary;
  const rawContent = (task as any).raw_content || task.title || '';
  
  // Someday: relaxed, show ai_summary if available
  const displayText = hasAiSummary 
    ? (task as any).ai_summary 
    : rawContent;
  
  const hasDualLayer = hasAiSummary && rawContent !== (task as any).ai_summary;
  
  // Calculate age
  const createdAt = task.created_at ? new Date(task.created_at) : new Date();
  const age = formatDistanceToNow(createdAt, { addSuffix: true });
  
  return {
    displayText: displayText || 'Empty idea',
    rawContent,
    hasDualLayer,
    age,
  };
}

interface SomedayTaskRowProps {
  task: Task;
  onActivate: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SomedayTaskRow = memo(({ 
  task, 
  onActivate, 
  onSnooze, 
  onDelete,
}: SomedayTaskRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    displayText,
    rawContent,
    hasDualLayer,
    age,
  } = getSomedayDualLayerDisplay(task);

  const handleToggleExpand = () => {
    if (hasDualLayer || rawContent.length > 100) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={cn(
        "py-4 px-4 rounded-lg transition-colors group",
        "hover:bg-muted/20",
        (hasDualLayer || rawContent.length > 100) && "cursor-pointer"
      )}
      onClick={handleToggleExpand}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* No checkbox - these are ideas, not tasks yet */}
      <div className="space-y-2">
        {/* Primary display - ai_summary, relaxed weight */}
        <p 
          className={cn(
            "text-[14px] leading-relaxed text-foreground/70",
            isExpanded && "text-foreground/80"
          )}
        >
          {displayText}
        </p>

        {/* Age indicator */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/40">
          <Clock className="w-3 h-3" />
          <span>Added {age}</span>
        </div>

        {/* Expand indicator */}
        {(hasDualLayer || rawContent.length > 100) && !isExpanded && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronDown className="w-3 h-3 text-muted-foreground/30" />
            <span className="text-[11px] text-muted-foreground/30">See more</span>
          </div>
        )}

        {/* Expanded state - full raw_content for reflection */}
        {isExpanded && (
          <div 
            className="mt-3 pt-3 border-t border-border/10 animate-fade-in space-y-3"
            style={{ animationDuration: '150ms' }}
          >
            {hasDualLayer && (
              <p className="text-[13px] text-foreground/50 leading-relaxed whitespace-pre-wrap">
                {rawContent}
              </p>
            )}
            
            {/* Someday-specific actions */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate(task.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary/80 hover:bg-primary/20 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Activate
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSnooze(task.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-muted/50 text-muted-foreground/60 hover:bg-muted/80 transition-colors"
              >
                <Clock className="w-3 h-3" />
                Revisit later
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-muted-foreground/40 hover:text-destructive/70 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Kill
              </button>
            </div>
            
            {/* Collapse button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
            >
              <ChevronDown className="w-3 h-3 rotate-180" />
              Less
            </button>
          </div>
        )}

        {/* Hover actions - minimal when not expanded */}
        {!isExpanded && isHovered && (
          <div 
            className="flex items-center gap-2 pt-1 animate-fade-in"
            style={{ animationDuration: '100ms' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => onActivate(task.id)}
              className="text-[10px] text-primary/60 hover:text-primary/80 transition-colors"
            >
              Activate
            </button>
            <span className="text-muted-foreground/20">·</span>
            <button 
              onClick={() => onDelete(task.id)}
              className="text-[10px] text-muted-foreground/40 hover:text-destructive/60 transition-colors"
            >
              Kill
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

SomedayTaskRow.displayName = 'SomedayTaskRow';
