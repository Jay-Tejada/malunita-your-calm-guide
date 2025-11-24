import { useTasks } from "@/hooks/useTasks";
import { priorityScorer } from "@/lib/priorityScorer";
import { contextMapper } from "@/lib/contextMapper";
import { agendaRouter } from "@/lib/agendaRouter";
import { TaskCardMinimal } from "../tasks/TaskCardMinimal";

export function TaskStream() {
  const { tasks, isLoading } = useTasks();

  // Filter incomplete tasks
  const incompleteTasks = tasks?.filter(t => !t.completed) || [];

  // Build the pipeline
  const extractedTasks = incompleteTasks.map(t => ({
    id: t.id,
    title: t.title,
    context: t.context,
    category: t.category,
    has_reminder: t.has_reminder,
    is_time_based: t.is_time_based,
    created_at: t.created_at,
    reminder_time: t.reminder_time,
  }));

  const contextMap = contextMapper(extractedTasks, null as any);
  const scores = priorityScorer(extractedTasks, null as any, contextMap);
  const routing = agendaRouter(extractedTasks, contextMap, scores);

  // Create task lookup map
  const taskMap = new Map(incompleteTasks.map(t => [t.id, t]));

  // Combine later tasks
  const laterTaskIds = [...routing.upcoming, ...routing.someday];

  // Check if we have any tasks at all
  const hasAnyTasks = incompleteTasks.length > 0;

  if (isLoading) {
    return (
      <div className="w-full pt-6">
        <div className="text-sm text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (!hasAnyTasks) {
    return (
      <div className="w-full py-10 flex items-center justify-center">
        <div className="text-sm text-muted-foreground text-center">
          Empty page. What's on your mind?
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pt-6">
      {/* Today Section */}
      {routing.today.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Today
          </h2>
          <div className="flex flex-col">
            {routing.today.map(taskId => {
              const task = taskMap.get(taskId);
              if (!task) return null;
              const isPrimaryFocus = task.category === 'primary_focus' && task.is_focus;
              return (
                <TaskCardMinimal
                  key={task.id}
                  task={{
                    id: task.id,
                    title: task.title,
                    due_date: task.reminder_time,
                    section: task.category,
                  }}
                  fullTask={task}
                  isPrimaryFocus={isPrimaryFocus}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* This Week Section */}
      {routing.this_week.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            This Week
          </h2>
          <div className="flex flex-col">
            {routing.this_week.map(taskId => {
              const task = taskMap.get(taskId);
              if (!task) return null;
              return (
                <TaskCardMinimal
                  key={task.id}
                  task={{
                    id: task.id,
                    title: task.title,
                    due_date: task.reminder_time,
                    section: task.category,
                  }}
                  fullTask={task}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Later Section */}
      {laterTaskIds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Later
          </h2>
          <div className="flex flex-col">
            {laterTaskIds.map(taskId => {
              const task = taskMap.get(taskId);
              if (!task) return null;
              return (
                <TaskCardMinimal
                  key={task.id}
                  task={{
                    id: task.id,
                    title: task.title,
                    due_date: task.reminder_time,
                    section: task.category,
                  }}
                  fullTask={task}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
