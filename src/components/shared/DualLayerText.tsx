import { useState, memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { getDualLayerDisplay } from '@/hooks/useDualLayerDisplay';
import { cn } from '@/lib/utils';

interface DualLayerTextProps {
  task: Task;
  isCompleting?: boolean;
  className?: string;
}

/**
 * Dual-layer text display component for tasks.
 * Shows ai_summary collapsed, raw_content on expand.
 */
export const DualLayerText = memo(({ task, isCompleting = false, className }: DualLayerTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    displayText,
    rawContent,
    hasDualLayer,
    isLongEntry,
    lowConfidence,
    hasAiSummary,
    showExpandIndicator,
  } = getDualLayerDisplay(task);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showExpandIndicator) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div 
      className={cn("flex-1 relative cursor-pointer", className)}
      onClick={handleToggleExpand}
    >
      {/* Primary display text */}
      <div className="relative">
        <p 
          className={cn(
            "text-sm leading-relaxed transition-all ease-out whitespace-pre-wrap",
            isLongEntry && !isExpanded && "line-clamp-2",
            isCompleting ? "text-foreground/40" : "text-foreground/80"
          )}
          style={{ transitionDuration: '100ms' }}
        >
          {displayText}
        </p>
        
        {/* Expand indicator for collapsible entries */}
        {showExpandIndicator && !isExpanded && (
          <div className="flex items-center gap-1 mt-1">
            <ChevronDown className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/40">
              {hasDualLayer ? 'Show original' : 'Show more'}
            </span>
          </div>
        )}
        
        {/* Fade gradient for long collapsed text */}
        {isLongEntry && !isExpanded && (
          <div 
            className="absolute bottom-5 left-0 right-0 h-6 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))',
            }}
          />
        )}
      </div>
      
      {/* Expanded view: Show raw content */}
      {isExpanded && (
        <div 
          className="mt-3 pt-3 border-t border-border/20 animate-fade-in"
          style={{ animationDuration: '150ms' }}
        >
          {hasDualLayer && (
            <>
              <p className="text-xs text-muted-foreground/50 mb-1.5 uppercase tracking-wide">
                Original
              </p>
              <p className="text-sm text-foreground/50 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                {rawContent}
              </p>
            </>
          )}
          
          {/* If just long entry (no dual layer), show full text */}
          {!hasDualLayer && isLongEntry && (
            <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
              {displayText}
            </p>
          )}
          
          {/* Collapse button */}
          <button 
            onClick={handleToggleExpand}
            className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
          >
            <ChevronDown className="w-3 h-3 rotate-180" />
            Collapse
          </button>
        </div>
      )}
      
      {/* Low confidence indicator */}
      {hasAiSummary && lowConfidence && !isExpanded && (
        <p className="text-xs text-amber-500/50 mt-1">
          Low confidence summary
        </p>
      )}
    </div>
  );
});

DualLayerText.displayName = 'DualLayerText';
