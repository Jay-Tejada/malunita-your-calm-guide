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
      <div 
        className="w-full flex justify-center"
        style={{ paddingTop: "24px" }}
      >
        <div 
          className="w-full flex flex-col"
          style={{ 
            maxWidth: "760px",
            gap: "12px"
          }}
        >
          <div style={{ color: "#7D7467", fontSize: "14px" }}>Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (!hasAnyTasks) {
    return (
      <div 
        className="w-full flex justify-center"
        style={{ paddingTop: "24px" }}
      >
        <div 
          className="w-full flex flex-col items-center"
          style={{ 
            maxWidth: "760px",
            padding: "40px 0"
          }}
        >
          <div 
            style={{ 
              color: "#7D7467", 
              fontSize: "15px",
              textAlign: "center"
            }}
          >
            Empty page. What's on your mind?
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full flex justify-center"
      style={{ paddingTop: "24px" }}
    >
      <div 
        className="w-full flex flex-col"
        style={{ 
          maxWidth: "760px",
          gap: "32px"
        }}
      >
        {/* Today Section */}
        {routing.today.length > 0 && (
          <div>
            <h2 
              style={{ 
                color: "#3B352B",
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "12px"
              }}
            >
              Today
            </h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {routing.today.map(taskId => {
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
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* This Week Section */}
        {routing.this_week.length > 0 && (
          <div>
            <h2 
              style={{ 
                color: "#3B352B",
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "12px"
              }}
            >
              This Week
            </h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
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
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Later Section */}
        {laterTaskIds.length > 0 && (
          <div>
            <h2 
              style={{ 
                color: "#3B352B",
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "12px"
              }}
            >
              Later
            </h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
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
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
