import { CheckCircle2, Circle, Clock, GripVertical, Target, Settings, Split, CalendarPlus, Zap, Lightbulb, Check, MoreVertical, Star, Edit2, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cn(
        "group grid grid-cols-[24px_1fr_auto] gap-3 items-start px-4 py-3 bg-bg-surface hover:bg-bg-surface-2 transition-colors",
        completed && "opacity-60",
        selected && "bg-bg-surface-2",
        isDragging && "opacity-50"
      )}
    >
      {/* Column 1: Checkbox - fixed 24px */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        {...attributes}
        {...listeners}
        className={cn(
          "w-6 h-6 mt-0.5 rounded-full flex items-center justify-center transition-all cursor-pointer border",
          completed
            ? "bg-bg-surface-2 border-border-strong"
            : "bg-transparent border-border-strong hover:border-accent-muted"
        )}
      >
        {completed && (
          <Check className="w-3 h-3 text-text-muted" />
        )}
      </button>

      {/* Column 2: Task text - fills remaining space */}
      <div 
        onClick={onSelect}
        className="cursor-pointer"
      >
        <p
          className={cn(
            "font-mono text-sm leading-relaxed break-words",
            completed ? "text-text-muted line-through" : "text-text-primary"
          )}
        >
          {title}
        </p>
        
        {/* Metadata */}
        {(time || context || cluster?.domain) && (
          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
            {time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {time}
              </span>
            )}
            {context && <span>• {context}</span>}
            {cluster?.domain && (
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 bg-bg-surface-2 border border-border-subtle text-text-secondary">
                {cluster.label || clusterDomain.label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Column 3: Actions - auto width, always aligned right */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 text-text-muted hover:text-text-secondary rounded hover:bg-bg-surface-2 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        
        {onTaskUpdate && !isInToday && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleMoveToToday(e);
            }}
            disabled={isMovingToToday}
            className="p-1.5 text-text-muted hover:text-text-secondary rounded hover:bg-bg-surface-2 transition-colors disabled:opacity-50"
            title="Move to Today"
          >
            <Star className="w-4 h-4" />
          </button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-foreground/40 hover:text-foreground/60 rounded hover:bg-foreground/5 transition-colors"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onPlanThis && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onPlanThis(title);
                }}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Plan This
              </DropdownMenuItem>
            )}

            {isBigTask && onCreateTasks && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleBreakDown(e);
                }}
                disabled={isSplitting}
              >
                <Split className="w-4 h-4 mr-2" />
                Break Down
              </DropdownMenuItem>
            )}

            {fullTask?.ai_metadata && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCorrectionPanel(true);
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Fix AI Output
              </DropdownMenuItem>
            )}

            {fullTask && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this task?')) {
                      window.location.reload();
                    }
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
