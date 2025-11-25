import { CheckCircle2, Circle, Clock, GripVertical, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useRef } from "react";

interface TaskCardProps {
  id: string;
  title: string;
  time?: string;
  context?: string;
  completed?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
  onSelect?: () => void;
  onLongPress?: () => void;
  goalAligned?: boolean | null;
  alignmentReason?: string | null;
  priority?: number | null;
}

export const TaskCard = ({ id, title, time, context, completed, selected, onToggle, onEdit, onSelect, onLongPress, goalAligned, alignmentReason, priority }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Long press detection
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isPressing = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    isPressing.current = true;
    pressTimer.current = setTimeout(() => {
      if (isPressing.current) {
        onLongPress?.();
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    isPressing.current = false;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300",
        completed
          ? "bg-success/10 border-success/30 hover:border-success/50"
          : "bg-card border-secondary hover:border-accent hover:shadow-md",
        selected && "ring-2 ring-accent shadow-lg",
        isDragging && "opacity-50 shadow-xl scale-105"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
      </button>

      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
      >
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
        )}
      </button>

      {/* Content */}
      <div 
        onClick={onEdit}
        className="flex-1 min-w-0 cursor-pointer"
      >
        <div className="flex items-start gap-2">
          <h3
            className={cn(
              "text-sm font-normal transition-all flex-1",
              completed ? "text-muted-foreground line-through" : "text-foreground"
            )}
          >
            {title}
          </h3>
          {goalAligned === true && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{alignmentReason || "Aligned with your goal"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {priority !== null && priority !== undefined && (
          <div 
            className="font-mono opacity-50 mt-0.5" 
            style={{ fontSize: '10px' }}
          >
            {priority >= 0.85 ? '🔥 Must' : priority >= 0.60 ? '⬆ Should' : '→ Could'}
          </div>
        )}
        {(time || context) && (
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {time}
              </span>
            )}
            {context && <span className="text-muted-foreground/70">• {context}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
