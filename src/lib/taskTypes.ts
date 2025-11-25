/**
 * Task type definitions and utilities
 * Virtual fields computed on-the-fly, not stored in database
 */

export type TaskType = 
  | 'admin'
  | 'communication'
  | 'errand'
  | 'focus'
  | 'physical'
  | 'creative'
  | 'delivery'
  | 'follow_up';

export interface VirtualTaskFlags {
  task_type?: TaskType;
  tiny_task?: boolean;
  heavy_task?: boolean;
  emotional_weight?: number; // 0-10 scale
}

export interface EnrichedTask {
  id: string;
  title: string;
  category?: string | null;
  completed: boolean;
  created_at: string;
  // Virtual flags
  task_type?: TaskType;
  tiny_task?: boolean;
  heavy_task?: boolean;
  emotional_weight?: number;
}

/**
 * Get user-friendly label for task type
 */
export function getTaskTypeLabel(taskType: TaskType): string {
  const labels: Record<TaskType, string> = {
    admin: 'Administrative',
    communication: 'Communication',
    errand: 'Errand',
    focus: 'Deep Work',
    physical: 'Physical',
    creative: 'Creative',
    delivery: 'Delivery',
    follow_up: 'Follow-up'
  };
  return labels[taskType];
}

/**
 * Get emoji for task type
 */
export function getTaskTypeEmoji(taskType: TaskType): string {
  const emojis: Record<TaskType, string> = {
    admin: '📋',
    communication: '💬',
    errand: '🏃',
    focus: '🎯',
    physical: '💪',
    creative: '🎨',
    delivery: '📦',
    follow_up: '🔄'
  };
  return emojis[taskType];
}
