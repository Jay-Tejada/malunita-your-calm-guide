import { format, isToday, isTomorrow } from "date-fns";
import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";
import { Check, Sparkles } from "lucide-react";
import { TaskLearningDialog } from "../TaskLearningDialog";

interface TaskCardMinimalProps {
  task: {
    id: string;
    title: string;
    due_date?: string;
    section?: string;
  };
  fullTask?: Task;
}

export function TaskCardMinimal({ task, fullTask }: TaskCardMinimalProps) {
  const { updateTask } = useTasks();
  const { onTaskCompleted, onQuickWinCompleted } = useCompanionEvents();
  const [isCompleting, setIsCompleting] = useState(false);
  const [showLearningDialog, setShowLearningDialog] = useState(false);

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
      
      // Trigger companion reaction (non-blocking)
      const isQuickWin = task.section === 'Quick Wins' || task.title.split(' ').length <= 5;
      if (isQuickWin) {
        onQuickWinCompleted();
      } else {
        onTaskCompleted(1);
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      setIsCompleting(false);
    }
  };

  const dueDate = formatDueDate(task.due_date);

  return (
    <>
      <div
        className="w-full py-4 transition-opacity hover:opacity-90 cursor-pointer flex items-start gap-3 group"
        style={{
          borderBottom: "1px solid #E6E1D7",
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
          className="font-medium mb-1"
          style={{
            color: "#3B352B",
            fontSize: "15px",
          }}
        >
          {task.title}
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

      {/* Learning Button */}
      {fullTask && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLearningDialog(true);
          }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
    </>
  );
}
