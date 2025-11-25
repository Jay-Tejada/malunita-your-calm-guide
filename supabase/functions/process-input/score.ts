import type { Task, UserContext } from "./types.ts";

const URGENCY_KEYWORDS = ['urgent', 'asap', 'now', 'today', 'immediately', 'critical', 'deadline', 'overdue'];
const IMPORTANCE_KEYWORDS = ['important', 'key', 'critical', 'essential', 'priority', 'must do', 'need to'];

export async function scorePriority(tasks: Task[], userContext: UserContext): Promise<Task[]> {
  return tasks.map(task => {
    const text = task.cleaned.toLowerCase();
    let score = 0;

    // Check for urgency keywords
    if (URGENCY_KEYWORDS.some(kw => text.includes(kw))) {
      score += 3;
    }

    // Check for importance keywords
    if (IMPORTANCE_KEYWORDS.some(kw => text.includes(kw))) {
      score += 2;
    }

    // Check for goal alignment
    if (userContext.goal) {
      const goalWords = userContext.goal.toLowerCase().split(' ');
      if (goalWords.some(word => word.length > 3 && text.includes(word))) {
        score += 2;
      }
    }

    // Penalty for complex tasks without clear deadline
    if (!task.isTiny && task.subtasks.length > 0) {
      score -= 1;
    }

    // Boost score if has explicit deadline
    if (task.due) {
      score += 1;
    }

    // Determine priority level
    let priority: 'must' | 'should' | 'could';
    if (score >= 4) {
      priority = 'must';
    } else if (score >= 2) {
      priority = 'should';
    } else {
      priority = 'could';
    }

    return {
      ...task,
      priority,
    };
  });
}
