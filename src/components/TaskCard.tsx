import { CheckCircle2, Circle, Clock, GripVertical, Target, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getClusterDomain } from "@/lib/knowledgeClusters";
import { useEffect, useRef, useState } from "react";
import { TaskCorrectionPanel } from "./tasks/TaskCorrectionPanel";
import { Task } from "@/hooks/useTasks";

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
  cluster?: {
    domain?: string | null;
    label?: string | null;
  } | null;
  fullTask?: Task;
  onTaskUpdate?: (updates: any) => void;
}

export const TaskCard = ({ id, title, time, context, completed, selected, onToggle, onEdit, onSelect, onLongPress, goalAligned, alignmentReason, priority, cluster, fullTask, onTaskUpdate }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [showCorrectionPanel, setShowCorrectionPanel] = useState(false);

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

  const clusterDomain = getClusterDomain(cluster?.domain);

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
          {fullTask?.ai_metadata && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCorrectionPanel(true);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="Fix AI Output"
            >
              <Settings className="w-4 h-4 text-muted-foreground hover:text-accent" />
            </button>
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
        {cluster?.domain && (
          <div className="mt-1">
            <span 
              className="inline-block rounded-full px-2 py-0.5 bg-neutral-100 text-neutral-500 font-mono"
              style={{ fontSize: '10px' }}
            >
              {cluster.label || clusterDomain.label}
            </span>
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

      {/* Correction Panel */}
      {fullTask?.ai_metadata && (
        <TaskCorrectionPanel
          task={fullTask}
          initialAIOutput={fullTask.ai_metadata}
          open={showCorrectionPanel}
          onClose={() => setShowCorrectionPanel(false)}
          onSubmitCorrection={async (correctedData) => {
            try {
              // Update task with corrected data
              if (onTaskUpdate) {
                await onTaskUpdate({
                  category: correctedData.category,
                  priority: correctedData.priority,
                  scheduled_bucket: correctedData.deadline || fullTask.scheduled_bucket,
                });
              }

              // Dispatch custom event
              window.dispatchEvent(new CustomEvent("ai:corrected", {
                detail: {
                  taskId: fullTask.id,
                  correctedData,
                }
              }));

              setShowCorrectionPanel(false);
            } catch (error) {
              console.error('Failed to apply corrections:', error);
            }
          }}
        />
      )}
    </div>
  );
};
