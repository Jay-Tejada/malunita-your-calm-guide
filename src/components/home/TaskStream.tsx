import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { priorityScorer } from "@/lib/priorityScorer";
import { contextMapper } from "@/lib/contextMapper";
import { agendaRouter } from "@/lib/agendaRouter";
import { TaskCardMinimal } from "../tasks/TaskCardMinimal";
import { useTaskStorylines } from "@/hooks/useTaskStorylines";
import { TaskStorylinesPanel } from "../storylines/TaskStorylinesPanel";

export function TaskStream() {
  const { tasks, isLoading } = useTasks();
  const { storylines, loading: storylinesLoading } = useTaskStorylines();
  const [selectedStorylineId, setSelectedStorylineId] = useState<string | null>(null);

  // Filter incomplete tasks
  let incompleteTasks = tasks?.filter(t => !t.completed) || [];
  
  // Filter by selected storyline if any
  if (selectedStorylineId) {
    const selectedStoryline = storylines.find(s => s.id === selectedStorylineId);
    if (selectedStoryline && selectedStoryline.allTaskIds) {
      incompleteTasks = incompleteTasks.filter(t => 
        selectedStoryline.allTaskIds!.includes(t.id)
      );
    }
  }

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

  // Sort function: MUST → SHOULD → COULD, with tiny tasks at bottom of each group
  const sortTasksByPriority = (taskIds: string[]) => {
    const tasksWithData = taskIds
      .map(id => {
        const task = taskMap.get(id);
        return task ? { id, task } : null;
      })
      .filter(Boolean) as Array<{ id: string; task: Task }>;

    return tasksWithData
      .sort((a, b) => {
        // Priority order
        const priorityOrder = { 'MUST': 0, 'SHOULD': 1, 'COULD': 2 };
        const aPriority = priorityOrder[a.task.priority || 'SHOULD'];
        const bPriority = priorityOrder[b.task.priority || 'SHOULD'];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Within same priority, non-tiny tasks first
        if (a.task.is_tiny !== b.task.is_tiny) {
          return a.task.is_tiny ? 1 : -1;
        }

        return 0;
      })
      .map(item => item.id);
  };

  // Apply sorting to each bucket
  const sortedToday = sortTasksByPriority(routing.today);
  const sortedThisWeek = sortTasksByPriority(routing.this_week);
  const laterTaskIds = [...routing.upcoming, ...routing.someday];
  const sortedLater = sortTasksByPriority(laterTaskIds);

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
      {/* Task Storylines Panel */}
      <TaskStorylinesPanel 
        storylines={storylines}
        loading={storylinesLoading}
        onStorylineSelect={setSelectedStorylineId}
        selectedStorylineId={selectedStorylineId}
      />
      
      {/* Today Section */}
      {sortedToday.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Today
          </h2>
          <div className="flex flex-col">
            {sortedToday.map(taskId => {
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
      {sortedThisWeek.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            This Week
          </h2>
          <div className="flex flex-col">
            {sortedThisWeek.map(taskId => {
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
      {sortedLater.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Later
          </h2>
          <div className="flex flex-col">
            {sortedLater.map(taskId => {
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
