/**
 * Task Enricher for Daily Command Center
 * Adds virtual flags to tasks during daily intelligence processing
 */

import { computeVirtualFlags, type VirtualTaskFlags } from '../_shared/taskTypeClassifier.ts';

interface TaskWithVirtualFlags {
  id: string;
  title: string;
  category: string | null;
  priority?: string;
  is_tiny_task?: boolean;
  completed: boolean;
  // Virtual flags
  task_type: string;
  tiny_task: boolean;
  heavy_task: boolean;
  emotional_weight: number;
}

/**
 * Enrich tasks with virtual computed flags
 */
export function enrichTasksWithVirtualFlags<T extends { id: string; title: string; category?: string | null; is_tiny_task?: boolean }>(
  tasks: T[]
): (T & VirtualTaskFlags)[] {
  return tasks.map(task => {
    const virtualFlags = computeVirtualFlags(task.title);
    return {
      ...task,
      ...virtualFlags
    };
  });
}

/**
 * Filter tasks by type
 */
export function filterTasksByType(
  tasks: TaskWithVirtualFlags[],
  type: VirtualTaskFlags['task_type']
): TaskWithVirtualFlags[] {
  return tasks.filter(t => t.task_type === type);
}

/**
 * Get high emotional weight tasks
 */
export function getHighEmotionalWeightTasks(
  tasks: TaskWithVirtualFlags[],
  threshold = 5
): TaskWithVirtualFlags[] {
  return tasks.filter(t => t.emotional_weight >= threshold);
}

/**
 * Separate tiny vs heavy tasks
 */
export function separateTasksByWeight(tasks: TaskWithVirtualFlags[]): {
  tiny: TaskWithVirtualFlags[];
  heavy: TaskWithVirtualFlags[];
  regular: TaskWithVirtualFlags[];
} {
  return {
    tiny: tasks.filter(t => t.tiny_task && !t.heavy_task),
    heavy: tasks.filter(t => t.heavy_task),
    regular: tasks.filter(t => !t.tiny_task && !t.heavy_task)
  };
}
