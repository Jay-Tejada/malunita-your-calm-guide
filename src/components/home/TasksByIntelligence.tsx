import { useTasks, Task } from "@/hooks/useTasks";
import { TaskCardMinimal } from "@/components/tasks/TaskCardMinimal";
import { Flame, MessageCircle, Zap, Calendar, Clock, Inbox } from "lucide-react";

export function TasksByIntelligence() {
  const { tasks } = useTasks();

  if (!tasks || tasks.length === 0) {
    return null;
  }

  // Filter out completed tasks
  const openTasks = tasks.filter(t => !t.completed);

  // Organize tasks by intelligence
  const todaysMusts = openTasks.filter(t => 
    (t.future_priority_score !== null && t.future_priority_score !== undefined && t.future_priority_score >= 0.85)
  );

  const followUps = openTasks.filter(t => 
    t.follow_up && t.follow_up.trim() !== ''
  );

  const quickWins = openTasks.filter(t => 
    t.is_tiny_task === true || t.is_tiny === true
  );

  const thisWeek = openTasks.filter(t => 
    t.scheduled_bucket === 'this_week'
  );

  const upcoming = openTasks.filter(t => 
    t.scheduled_bucket === 'upcoming'
  );

  const someday = openTasks.filter(t => 
    !t.future_priority_score || t.future_priority_score < 0.85 &&
    !t.follow_up &&
    !t.is_tiny_task &&
    !t.is_tiny &&
    t.scheduled_bucket !== 'this_week' &&
    t.scheduled_bucket !== 'upcoming'
  );

  const renderSection = (
    title: string,
    tasks: Task[],
    icon: React.ReactNode,
    emptyMessage?: string
  ) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 px-4">
          <div className="text-muted-foreground">{icon}</div>
          <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            {title}
          </h2>
          <div className="text-[10px] font-mono text-muted-foreground/50">
            {tasks.length}
          </div>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCardMinimal
              key={task.id}
              task={{
                id: task.id,
                title: task.title,
                due_date: task.reminder_time,
              }}
              fullTask={task}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-32">
      {renderSection(
        "Today's Musts",
        todaysMusts,
        <Flame className="w-4 h-4" />
      )}
      
      {renderSection(
        "Follow-Ups",
        followUps,
        <MessageCircle className="w-4 h-4" />
      )}
      
      {renderSection(
        "Quick Wins",
        quickWins,
        <Zap className="w-4 h-4" />
      )}
      
      {renderSection(
        "This Week",
        thisWeek,
        <Calendar className="w-4 h-4" />
      )}
      
      {renderSection(
        "Upcoming",
        upcoming,
        <Clock className="w-4 h-4" />
      )}
      
      {renderSection(
        "Someday",
        someday,
        <Inbox className="w-4 h-4" />
      )}
    </div>
  );
}
