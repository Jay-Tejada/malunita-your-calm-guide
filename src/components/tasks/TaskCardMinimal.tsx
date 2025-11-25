import { format, isToday, isTomorrow } from "date-fns";
import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";
import { useTaskStreak } from "@/hooks/useTaskStreak";
import { Check, Sparkles, Zap, Settings, Split, CalendarPlus } from "lucide-react";
import { TaskLearningDialog } from "../TaskLearningDialog";
import { TaskCorrectionPanel } from "./TaskCorrectionPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaskCardMinimalProps {
  task: {
    id: string;
    title: string;
    due_date?: string;
    section?: string;
  };
  fullTask?: Task;
  isPrimaryFocus?: boolean;
}

export function TaskCardMinimal({ task, fullTask, isPrimaryFocus }: TaskCardMinimalProps) {
  const { updateTask, createTasks } = useTasks();
  const { onTaskCompleted, onQuickWinCompleted } = useCompanionEvents();
  const { registerCompletion, streakCount } = useTaskStreak();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);
  const [showLearningDialog, setShowLearningDialog] = useState(false);
  const [showCorrectionPanel, setShowCorrectionPanel] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isMovingToToday, setIsMovingToToday] = useState(false);

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return "Due Today";
    }
    
    if (isTomorrow(date)) {
      return "Due Tomorrow";
    }
    
    return format(date, "MMM d");
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      // Mark task as complete
      await updateTask({
        id: task.id,
        updates: {
          completed: true,
          completed_at: new Date().toISOString(),
        },
      });
      
      // Register completion for streak tracking
      const currentStreak = registerCompletion(task.id);
      
      // Trigger companion reaction based on streak
      const isQuickWin = task.section === 'Quick Wins' || task.title.split(' ').length <= 5;
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
    } catch (error) {
      console.error('Failed to complete task:', error);
      setIsCompleting(false);
    }
  };

  const handleBreakDown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isSplitting || !fullTask) return;
    
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
        
        await createTasks(subtasks);
        
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
    
    if (isMovingToToday || !fullTask) return;
    
    setIsMovingToToday(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await updateTask({
        id: task.id,
        updates: {
          is_focus: true,
          focus_date: today,
          scheduled_bucket: 'today',
        },
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

  const dueDate = formatDueDate(task.due_date);
  
  // Determine if task is "big" (heavy task or has emotional weight)
  const isBigTask = fullTask && (
    (fullTask.ai_metadata as any)?.heavy_task ||
    (fullTask.ai_metadata as any)?.emotional_weight > 5 ||
    fullTask.title.split(' ').length > 8
  );
  
  // Check if task is already in Today
  const isInToday = fullTask?.is_focus || fullTask?.scheduled_bucket === 'today';

  return (
    <>
      <div
        className="w-full py-4 transition-opacity hover:opacity-90 cursor-pointer flex items-start gap-3 group"
        style={{
          borderBottom: "1px solid #E6E1D7",
          backgroundColor: isPrimaryFocus ? "rgba(139, 69, 19, 0.05)" : "transparent",
          borderLeft: isPrimaryFocus ? "3px solid #8B4513" : "none",
          paddingLeft: isPrimaryFocus ? "12px" : "0",
        }}
      >
      {/* Checkbox */}
      <button
        onClick={handleComplete}
        disabled={isCompleting}
        className="flex-shrink-0 mt-0.5"
        style={{
          width: "20px",
          height: "20px",
          border: "2px solid #B5A89A",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isCompleting ? "#E5D7C2" : "transparent",
          cursor: isCompleting ? "default" : "pointer",
          transition: "all 0.2s",
        }}
      >
        {isCompleting && <Check size={14} style={{ color: "#3B352B" }} />}
      </button>

      <div className="flex-1">
        {/* Task Title */}
        <div
          className="font-medium mb-1 flex items-center gap-2 flex-wrap"
          style={{
            color: "#3B352B",
            fontSize: "15px",
          }}
        >
          <span>{task.title}</span>
          {isPrimaryFocus && (
            <span 
              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
              style={{
                color: "#8B4513",
                backgroundColor: "rgba(139, 69, 19, 0.1)",
              }}
            >
              Primary Focus
            </span>
          )}
          {/* Intelligence Tags */}
          {fullTask?.priority && (
            <span 
              className="text-[9px] font-mono font-semibold uppercase tracking-wide px-1.5 py-0.5"
              style={{
                color: "#7D7467",
                border: "1px solid #B5A89A",
                borderRadius: "2px",
              }}
            >
              {fullTask.priority}
            </span>
          )}
          {fullTask?.category && (
            <span 
              className="text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5"
              style={{
                color: "#7D7467",
                backgroundColor: "rgba(181, 168, 154, 0.15)",
                borderRadius: "2px",
              }}
            >
              {fullTask.category}
            </span>
          )}
          {fullTask?.is_tiny && (
            <div title="Quick task">
              <Zap 
                size={12} 
                style={{ 
                  color: "#7D7467",
                  flexShrink: 0 
                }} 
              />
            </div>
          )}
        </div>

        {/* Subtext: Due Date and Section */}
        {(dueDate || task.section) && (
          <div
            className="flex items-center gap-3"
            style={{
              color: "#7D7467",
              fontSize: "13px",
            }}
          >
            {dueDate && <span>{dueDate}</span>}
            {task.section && (
              <>
                {dueDate && <span>•</span>}
                <span>{task.section}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {fullTask && (
        <div className="flex-shrink-0 flex items-center gap-1">
          {/* Break Down Button (for big tasks) */}
          {isBigTask && (
            <button
              onClick={handleBreakDown}
              disabled={isSplitting}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                marginTop: "2px",
                padding: "4px",
                borderRadius: "4px",
                color: "#9B8C7A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Break down into smaller tasks"
            >
              <Split size={16} />
            </button>
          )}

          {/* Move to Today Button */}
          {!isInToday && (
            <button
              onClick={handleMoveToToday}
              disabled={isMovingToToday}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                marginTop: "2px",
                padding: "4px",
                borderRadius: "4px",
                color: "#9B8C7A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Move to Today"
            >
              <CalendarPlus size={16} />
            </button>
          )}
          
          {/* Fix AI Output Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCorrectionPanel(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              marginTop: "2px",
              padding: "4px",
              borderRadius: "4px",
              color: "#9B8C7A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Fix AI Output"
          >
            <Settings size={16} />
          </button>

          {/* Learning Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLearningDialog(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              marginTop: "2px",
              padding: "4px",
              borderRadius: "4px",
              color: "#9B8C7A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Help Malunita learn from this"
          >
            <Sparkles size={16} />
          </button>
        </div>
      )}
    </div>

    {/* Learning Dialog */}
    {fullTask && (
      <TaskLearningDialog
        open={showLearningDialog}
        task={fullTask}
        onClose={() => setShowLearningDialog(false)}
      />
    )}

    {/* Correction Panel */}
    {fullTask && fullTask.ai_metadata && (
      <TaskCorrectionPanel
        task={fullTask}
        initialAIOutput={fullTask.ai_metadata}
        open={showCorrectionPanel}
        onClose={() => setShowCorrectionPanel(false)}
        onSubmitCorrection={async (correctedData) => {
          try {
            // Update task with corrected data
            await updateTask({
              id: fullTask.id,
              updates: {
                category: correctedData.category,
                priority: correctedData.priority,
                scheduled_bucket: correctedData.deadline || fullTask.scheduled_bucket,
              },
            });

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
    </>
  );
}
