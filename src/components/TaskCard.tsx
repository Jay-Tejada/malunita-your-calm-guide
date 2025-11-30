import { CheckCircle2, Circle, Clock, GripVertical, Target, Settings, Split, CalendarPlus, Zap, Lightbulb, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getClusterDomain } from "@/lib/knowledgeClusters";
import { useEffect, useRef, useState } from "react";
import { TaskCorrectionPanel } from "./tasks/TaskCorrectionPanel";
import { TaskActionSheet } from "./tasks/TaskActionSheet";
import { Task } from "@/hooks/useTasks";
import { useTaskStreak } from "@/hooks/useTaskStreak";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  onCreateTasks?: (tasks: any[]) => Promise<void>;
  onPlanThis?: (title: string) => void;
}

export const TaskCard = ({ id, title, time, context, completed, selected, onToggle, onEdit, onSelect, onLongPress, goalAligned, alignmentReason, priority, cluster, fullTask, onTaskUpdate, onCreateTasks, onPlanThis }: TaskCardProps) => {
  const { registerCompletion } = useTaskStreak();
  const { onTaskCompleted, onQuickWinCompleted } = useCompanionEvents();
  const { toast } = useToast();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [showCorrectionPanel, setShowCorrectionPanel] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isMovingToToday, setIsMovingToToday] = useState(false);

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

  // Enhanced toggle handler with streak tracking
  const handleToggle = () => {
    if (!completed && onToggle) {
      // Register completion for streak tracking
      const currentStreak = registerCompletion(id);
      
      // Trigger companion events
      const isQuickWin = title.split(' ').length <= 5;
      if (currentStreak >= 2) {
        // Streak detected!
        onTaskCompleted(currentStreak);
        toast({
          title: `${currentStreak} task streak! 🔥`,
          description: "You're on fire!",
        });
      } else if (isQuickWin) {
        onQuickWinCompleted();
      } else {
        onTaskCompleted(1);
      }
    }
    
    onToggle?.();
  };

  const handleBreakDown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isSplitting || !fullTask || !onCreateTasks) return;
    
    setIsSplitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('split-tasks', {
        body: { text: fullTask.title }
      });
      
      if (error) throw error;
      
      if (data?.tasks && data.tasks.length > 1) {
        // Create subtasks
        const subtasks = data.tasks.map((t: any) => ({
          title: t.title,
          parent_task_id: fullTask.id,
          category: fullTask.category,
          is_time_based: t.is_time_based,
          has_reminder: t.has_reminder,
          keywords: t.keywords,
        }));
        
        await onCreateTasks(subtasks);
        
        toast({
          title: "Task broken down",
          description: `Created ${subtasks.length} subtasks`,
        });
      } else {
        toast({
          title: "Task is already simple",
          description: "This task doesn't need breaking down",
        });
      }
    } catch (error) {
      console.error('Failed to break down task:', error);
      toast({
        title: "Failed to break down task",
        variant: "destructive",
      });
    } finally {
      setIsSplitting(false);
    }
  };

  const handleMoveToToday = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMovingToToday || !fullTask || !onTaskUpdate) return;
    
    setIsMovingToToday(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await onTaskUpdate({
        is_focus: true,
        focus_date: today,
        scheduled_bucket: 'today',
      });
      
      toast({
        title: "Moved to Today",
        description: "Task added to today's focus",
      });
    } catch (error) {
      console.error('Failed to move task to today:', error);
      toast({
        title: "Failed to move task",
        variant: "destructive",
      });
    } finally {
      setIsMovingToToday(false);
    }
  };

  const clusterDomain = getClusterDomain(cluster?.domain);
  
  // Determine if task is "big" (heavy task or has emotional weight)
  const isBigTask = fullTask && (
    (fullTask.ai_metadata as any)?.heavy_task ||
    (fullTask.ai_metadata as any)?.emotional_weight > 5 ||
    fullTask.title.split(' ').length > 8
  );
  
  // Check if task is already in Today
  const isInToday = fullTask?.is_focus || fullTask?.scheduled_bucket === 'today';
  
  // Check if task is tiny
  const isTinyTask = fullTask?.is_tiny || fullTask?.is_tiny_task || (fullTask?.ai_metadata as any)?.tiny_task;

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
          handleToggle();
        }}
        className={cn(
          "flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all",
          completed
            ? "bg-foreground/10 border border-foreground/20"
            : "bg-transparent border border-foreground/20 hover:border-foreground/40"
        )}
      >
        {completed && (
          <Check className="w-3 h-3 text-foreground/60" />
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
              "text-sm font-mono transition-all flex-1",
              completed ? "text-muted-foreground line-through" : "text-foreground"
            )}
          >
            {title}
          </h3>
          
          {/* Tiny task indicator */}
          {isTinyTask && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Zap className="w-3 h-3 text-amber-500 flex-shrink-0 mt-1" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Quick task</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
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
          
          {/* Action buttons group */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Plan This Button */}
            {onPlanThis && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlanThis(title);
                }}
                className="flex-shrink-0"
                title="Plan This"
              >
                <Lightbulb className="w-4 h-4 text-muted-foreground hover:text-accent" />
              </button>
            )}

            {/* Break Down Button (for big tasks) */}
            {isBigTask && onCreateTasks && (
              <button
                onClick={handleBreakDown}
                disabled={isSplitting}
                className="flex-shrink-0"
                title="Break down into smaller tasks"
              >
                <Split className="w-4 h-4 text-muted-foreground hover:text-accent" />
              </button>
            )}

            {/* Move to Today Button */}
            {!isInToday && onTaskUpdate && (
              <button
                onClick={handleMoveToToday}
                disabled={isMovingToToday}
                className="flex-shrink-0"
                title="Move to Today"
              >
                <CalendarPlus className="w-4 h-4 text-muted-foreground hover:text-accent" />
              </button>
            )}
            
            {fullTask?.ai_metadata && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCorrectionPanel(true);
                }}
                className="flex-shrink-0"
                title="Fix AI Output"
              >
                <Settings className="w-4 h-4 text-muted-foreground hover:text-accent" />
              </button>
            )}
            
            {/* Action Sheet Menu */}
            {fullTask && (
              <TaskActionSheet
                task={fullTask}
                onUpdate={() => onTaskUpdate?.({})}
                onDelete={() => window.location.reload()}
                onBreakDown={isBigTask && onCreateTasks ? handleBreakDown : undefined}
              />
            )}
          </div>
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
