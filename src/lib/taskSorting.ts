import { Task } from "@/hooks/useTasks";

/**
 * Intelligent Task Sorting System
 * 
 * Sort order:
 * 1. ONE Thing focus (if set)
 * 2. High priority tasks (MUST)
 * 3. Due today
 * 4. Overdue tasks
 * 5. Tiny Tasks
 * 6. Normal tasks (SHOULD)
 * 7. Low-priority (COULD) or Someday
 */

export function sortTasksByIntelligentPriority(tasks: Task[]): Task[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  return [...tasks].sort((a, b) => {
    // 1. ONE Thing focus always on top
    if (a.is_focus && !b.is_focus) return -1;
    if (!a.is_focus && b.is_focus) return 1;

    // Helper: Check if task is due today
    const isDueToday = (task: Task) => {
      if (!task.reminder_time) return false;
      const dueDate = new Date(task.reminder_time);
      return dueDate >= todayStart && dueDate < todayEnd;
    };

    // Helper: Check if task is overdue
    const isOverdue = (task: Task) => {
      if (!task.reminder_time) return false;
      const dueDate = new Date(task.reminder_time);
      return dueDate < now;
    };

    const aDueToday = isDueToday(a);
    const bDueToday = isDueToday(b);
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);
    const aPriority = a.priority || a.ai_metadata?.priority || 'SHOULD';
    const bPriority = b.priority || b.ai_metadata?.priority || 'SHOULD';
    const aTiny = a.is_tiny || a.is_tiny_task || false;
    const bTiny = b.is_tiny || b.is_tiny_task || false;

    // 2. High priority (MUST) tasks
    if (aPriority === 'MUST' && bPriority !== 'MUST') return -1;
    if (aPriority !== 'MUST' && bPriority === 'MUST') return 1;

    // 3. Due today (non-overdue)
    if (aDueToday && !aOverdue && !bDueToday) return -1;
    if (!aDueToday && bDueToday && !bOverdue) return 1;

    // 4. Overdue tasks
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // 5. Tiny tasks come after normal but before low priority
    // Only apply tiny sorting within same priority level
    if (aPriority === bPriority) {
      // Normal tasks (non-tiny) before tiny tasks
      if (!aTiny && bTiny) return -1;
      if (aTiny && !bTiny) return 1;
    }

    // 6. Normal tasks (SHOULD priority)
    if (aPriority === 'SHOULD' && bPriority === 'COULD') return -1;
    if (aPriority === 'COULD' && bPriority === 'SHOULD') return 1;

    // 7. Low priority / Someday tasks are at bottom (COULD)
    // Already handled above

    // Stable sort: use creation date as final tiebreaker
    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();
    return bDate - aDate; // Newer tasks first within same category
  });
}

/**
 * Sort task IDs based on a task map
 */
export function sortTaskIdsByPriority(
  taskIds: string[],
  taskMap: Map<string, Task>
): string[] {
  const tasksWithData = taskIds
    .map(id => taskMap.get(id))
    .filter(Boolean) as Task[];

  const sorted = sortTasksByIntelligentPriority(tasksWithData);
  return sorted.map(task => task.id);
}
