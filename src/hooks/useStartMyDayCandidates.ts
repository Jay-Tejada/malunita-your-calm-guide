import { useMemo } from 'react';
import { useTasks, Task } from './useTasks';
import { differenceInHours, parseISO, isToday, isTomorrow } from 'date-fns';

export type EnergyLevel = 'low' | 'medium' | 'high';

interface CandidateTask extends Task {
  score: number;
  reason: string;
}

interface StartMyDayCandidates {
  primaryCandidates: CandidateTask[];
  supportingTasks: (taskId: string) => Task[];
  isLoading: boolean;
}

/**
 * Selects AI-weighted candidate tasks for Start My Day flow.
 * Weighs by: deadline proximity, priority, project importance, energy fit.
 */
export function useStartMyDayCandidates(energyLevel: EnergyLevel = 'medium'): StartMyDayCandidates {
  const { tasks, isLoading } = useTasks();

  const primaryCandidates = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const now = new Date();
    const incompleteTasks = tasks.filter(t => !t.completed);

    // Score each task
    const scoredTasks: CandidateTask[] = incompleteTasks.map(task => {
      let score = 0;
      let reason = '';

      // 1. Deadline proximity (highest weight)
      if (task.reminder_time) {
        const deadline = parseISO(task.reminder_time);
        const hoursUntil = differenceInHours(deadline, now);
        if (hoursUntil <= 24) {
          score += 50;
          reason = 'Due within 24h';
        } else if (hoursUntil <= 48) {
          score += 35;
          reason = 'Due within 48h';
        } else if (hoursUntil <= 72) {
          score += 20;
          reason = 'Due soon';
        }
      }

      // 2. Already scheduled for today
      if (task.scheduled_bucket === 'today') {
        score += 30;
        if (!reason) reason = 'Scheduled for today';
      }

      // 3. Priority flag from AI metadata
      const priority = task.ai_metadata?.priority || task.priority;
      if (priority === 'MUST') {
        score += 40;
        if (!reason) reason = 'High priority';
      } else if (priority === 'SHOULD') {
        score += 20;
        if (!reason) reason = 'Important';
      }

      // 4. Project-linked tasks (organized work)
      if (task.project_id) {
        score += 15;
        if (!reason) reason = 'Part of a project';
      }

      // 5. Focus date is today
      if (task.focus_date && isToday(parseISO(task.focus_date))) {
        score += 25;
        if (!reason) reason = 'Marked for today';
      }

      // 6. Energy-based adjustment
      const effort = task.effort || (task.is_tiny_task ? 'tiny' : 'medium');
      if (energyLevel === 'low') {
        // Favor tiny/small tasks when low energy
        if (effort === 'tiny') score += 25;
        else if (effort === 'small') score += 15;
        else if (effort === 'large') score -= 20;
      } else if (energyLevel === 'high') {
        // Favor impactful tasks when high energy
        if (effort === 'large') score += 15;
        if (task.future_priority_score && task.future_priority_score > 0.7) {
          score += 20;
          if (!reason) reason = 'High impact';
        }
      }

      // 7. Goal aligned bonus
      if (task.goal_aligned) {
        score += 15;
        if (!reason) reason = 'Aligned with goals';
      }

      // 8. Recency penalty for very old inbox items
      const ageInDays = differenceInHours(now, parseISO(task.created_at)) / 24;
      if (ageInDays > 14 && !task.scheduled_bucket) {
        score -= 10; // Stale inbox items less likely
      }

      // Default reason if none set
      if (!reason) {
        if (task.category === 'work') reason = 'Work task';
        else if (task.category === 'personal') reason = 'Personal task';
        else reason = 'Available task';
      }

      return { ...task, score, reason };
    });

    // Sort by score descending, take top 3
    return scoredTasks
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [tasks, energyLevel]);

  // Get supporting tasks related to a primary task
  const supportingTasks = useMemo(() => {
    return (primaryTaskId: string): Task[] => {
      if (!tasks) return [];

      const primaryTask = tasks.find(t => t.id === primaryTaskId);
      if (!primaryTask) return [];

      const incompleteTasks = tasks.filter(t => !t.completed && t.id !== primaryTaskId);

      // Find related tasks by:
      // 1. Same project
      // 2. Same category
      // 3. Similar keywords
      const related = incompleteTasks.filter(t => {
        // Same project
        if (primaryTask.project_id && t.project_id === primaryTask.project_id) {
          return true;
        }
        // Same category (non-inbox)
        if (primaryTask.category && primaryTask.category !== 'inbox' && t.category === primaryTask.category) {
          return true;
        }
        // Shared keywords
        if (primaryTask.keywords && t.keywords) {
          const shared = primaryTask.keywords.filter(k => t.keywords?.includes(k));
          if (shared.length > 0) return true;
        }
        return false;
      });

      // Prioritize tiny tasks and already-scheduled-today tasks
      const scored = related.map(t => {
        let priority = 0;
        if (t.scheduled_bucket === 'today') priority += 10;
        if (t.is_tiny_task || t.effort === 'tiny') priority += 8;
        if (t.effort === 'small') priority += 5;
        if (t.project_id === primaryTask.project_id) priority += 5;
        return { ...t, _priority: priority };
      });

      return scored
        .sort((a, b) => b._priority - a._priority)
        .slice(0, 4)
        .map(({ _priority, ...task }) => task as Task);
    };
  }, [tasks]);

  return {
    primaryCandidates,
    supportingTasks,
    isLoading,
  };
}
