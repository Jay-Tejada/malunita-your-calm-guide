import { useTasks, Task } from "@/hooks/useTasks";
import { TodayTaskRow } from "./TodayTaskRow";

interface TodayTaskListProps {
  showCompleted: boolean;
}

const TODAY_CONFIDENCE_THRESHOLD = 0.7;

export const TodayTaskList = ({ showCompleted }: TodayTaskListProps) => {
  const { tasks, isLoading, updateTask } = useTasks();

  const todayDate = new Date().toISOString().split('T')[0];

  // Get today's tasks with confidence gate
  const todayTasks = tasks?.filter(t => {
    // Always include completed if showCompleted
    if (showCompleted && t.completed) return true;
    if (!showCompleted && t.completed) return false;
    
    // Check if scheduled for today
    const isScheduledForToday = t.scheduled_bucket === 'today' || t.focus_date === todayDate;
    if (!isScheduledForToday) return false;
    
    // Confidence gate: items with confidence < 0.7 should stay in Inbox
    const confidence = (t as any).ai_confidence ?? 1.0;
    const hasAiSummary = !!(t as any).ai_summary;
    
    // If has AI summary with low confidence, exclude from Today
    if (hasAiSummary && confidence < TODAY_CONFIDENCE_THRESHOLD) {
      return false;
    }
    
    return true;
  }) || [];

  // Group by priority
  const mustTasks = todayTasks.filter(t => t.ai_metadata?.priority === 'MUST' || t.priority === 'MUST');
  const shouldTasks = todayTasks.filter(t => t.ai_metadata?.priority === 'SHOULD' || t.priority === 'SHOULD');
  const couldTasks = todayTasks.filter(t => t.ai_metadata?.priority === 'COULD' || t.priority === 'COULD');
  const otherTasks = todayTasks.filter(t => !t.ai_metadata?.priority && !t.priority);

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await updateTask({
        id: taskId,
        updates: {
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null,
        }
      });
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const renderTaskGroup = (tasks: Task[], label?: string) => {
    if (tasks.length === 0) return null;

    return (
      <div className="space-y-0.5">
        {label && (
          <div className="h-px bg-border/10 my-3" />
        )}
        {tasks.map((task) => (
          <TodayTaskRow 
            key={task.id} 
            task={task} 
            onToggle={handleToggleTask}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40 mb-3">
        Today's Tasks
      </h3>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground/40 text-sm">Loading...</p>
        </div>
      ) : todayTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground/40 text-sm">No tasks scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {renderTaskGroup(mustTasks)}
          {renderTaskGroup(shouldTasks, shouldTasks.length > 0 && mustTasks.length > 0 ? 'should' : undefined)}
          {renderTaskGroup(couldTasks, couldTasks.length > 0 && (mustTasks.length > 0 || shouldTasks.length > 0) ? 'could' : undefined)}
          {renderTaskGroup(otherTasks, otherTasks.length > 0 && (mustTasks.length > 0 || shouldTasks.length > 0 || couldTasks.length > 0) ? 'other' : undefined)}
        </div>
      )}
    </div>
  );
};
