import { useMemoryEngine } from '@/state/memoryEngine';

interface Task {
  id?: string;
  title: string;
  category?: string;
  reminder_time?: string | null;
  is_focus?: boolean;
  focus_date?: string | null;
  keywords?: string[];
  context?: string;
  future_priority_score?: number;
}

interface ContextMap {
  projects: Array<{ name: string; task_ids: string[] }>;
  categories: Array<{ category: string; task_ids: string[] }>;
  people_mentions: string[];
  implied_deadlines: Array<{ task_id: string; deadline: string }>;
  time_sensitivity: Array<{ task_id: string; urgency: 'high' | 'medium' | 'low' }>;
}

interface TaskScore {
  task_id: string;
  priority: 'MUST' | 'SHOULD' | 'COULD';
  effort: 'tiny' | 'small' | 'medium' | 'large';
  fiesta_ready: boolean;
  big_task: boolean;
}

interface RelatedTaskSuggestion {
  task_id: string;
  task_title: string;
  shared_keywords: string[];
  suggested_bucket: 'today' | 'this_week';
}

interface AgendaRouting {
  today: string[];
  tomorrow: string[];
  this_week: string[];
  upcoming: string[];
  someday: string[];
  relatedTaskSuggestions?: RelatedTaskSuggestion[];
}

const MAX_TODAY_TASKS = 8; // Limit for "today" bucket to avoid overwhelming
const MAX_RELATED_SUGGESTIONS = 2; // Maximum related tasks to suggest

function isOverdue(deadline: string): boolean {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  return deadlineDate < now;
}

function getDateBucket(deadline: string): 'today' | 'tomorrow' | 'this_week' | 'upcoming' {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const today = new Date(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  deadlineDate.setHours(0, 0, 0, 0);
  
  if (deadlineDate <= today) return 'today';
  if (deadlineDate <= tomorrow) return 'tomorrow';
  if (deadlineDate <= weekEnd) return 'this_week';
  return 'upcoming';
}

function routeTaskByPriority(
  priority: 'MUST' | 'SHOULD' | 'COULD',
  big_task: boolean,
  fiesta_ready: boolean
): 'today' | 'tomorrow' | 'this_week' | 'upcoming' | 'someday' {
  // MUST tasks with no explicit deadline
  if (priority === 'MUST') {
    if (big_task) return 'this_week'; // Big MUSTs need more planning
    return 'today';
  }
  
  // SHOULD tasks
  if (priority === 'SHOULD') {
    if (big_task) return 'this_week';
    if (fiesta_ready) return 'today'; // Quick wins go today
    return 'tomorrow';
  }
  
  // COULD tasks - lower priority
  if (priority === 'COULD') {
    if (big_task) return 'upcoming';
    return 'someday';
  }
  
  return 'upcoming';
}

/**
 * Find related tasks based on keyword overlap with the primary focus task
 */
function findRelatedTasks(
  primaryFocusTask: Task,
  allTasks: Task[],
  primaryFocusTaskIds: string[]
): RelatedTaskSuggestion[] {
  if (!primaryFocusTask.keywords || primaryFocusTask.keywords.length === 0) {
    return [];
  }

  const primaryKeywords = new Set(primaryFocusTask.keywords.map(k => k.toLowerCase()));
  const relatedTasks: Array<{ task: Task; sharedKeywords: string[]; score: number }> = [];

  for (const task of allTasks) {
    // Skip if it's a primary focus task, completed, or has no ID
    if (!task.id || primaryFocusTaskIds.includes(task.id)) continue;

    // Skip if task has no keywords
    if (!task.keywords || task.keywords.length === 0) continue;

    // Calculate keyword overlap
    const taskKeywords = task.keywords.map(k => k.toLowerCase());
    const sharedKeywords = taskKeywords.filter(k => primaryKeywords.has(k));

    if (sharedKeywords.length > 0) {
      // Score based on keyword overlap
      const score = sharedKeywords.length;
      relatedTasks.push({ task, sharedKeywords, score });
    }
  }

  // Sort by score (most overlap first) and limit to MAX_RELATED_SUGGESTIONS
  relatedTasks.sort((a, b) => b.score - a.score);
  const topRelated = relatedTasks.slice(0, MAX_RELATED_SUGGESTIONS);

  // Convert to suggestions with appropriate buckets
  return topRelated.map((related, index) => ({
    task_id: related.task.id!,
    task_title: related.task.title,
    shared_keywords: related.sharedKeywords,
    // First suggestion goes to today, second to this_week
    suggested_bucket: index === 0 ? 'today' : 'this_week',
  }));
}

export function agendaRouter(
  extractedTasks: Task[],
  contextMap: ContextMap,
  priorityScores: TaskScore[]
): AgendaRouting {
  const routing: AgendaRouting = {
    today: [],
    tomorrow: [],
    this_week: [],
    upcoming: [],
    someday: [],
    relatedTaskSuggestions: [],
  };
  
  const tasks = extractedTasks || [];
  const context = contextMap || { implied_deadlines: [], time_sensitivity: [] };
  const scores = priorityScores || [];
  
  // Create lookup maps for efficiency
  const scoreMap = new Map<string, TaskScore>();
  scores.forEach(s => scoreMap.set(s.task_id, s));
  
  const deadlineMap = new Map<string, string>();
  context.implied_deadlines.forEach(d => deadlineMap.set(d.task_id, d.deadline));
  
  // Track how many tasks already assigned to today
  let todayCount = 0;
  
  // First pass: handle primary focus tasks (always first in today)
  const primaryFocusTasks: string[] = [];
  let primaryFocusTask: Task | null = null;
  
  for (const task of tasks) {
    if (!task.id) continue;
    
    const today = new Date().toISOString().split('T')[0];
    if (task.category === 'primary_focus' && task.is_focus && task.focus_date === today) {
      primaryFocusTasks.push(task.id);
      todayCount++;
      // Store the primary focus task for related task detection
      if (!primaryFocusTask) {
        primaryFocusTask = task;
      }
    }
  }
  
  // Find related tasks if there's a primary focus
  if (primaryFocusTask) {
    routing.relatedTaskSuggestions = findRelatedTasks(
      primaryFocusTask,
      tasks,
      primaryFocusTasks
    );
  }
  
  // Get memory profile for personalization
  const memory = useMemoryEngine.getState();
  
  // MEMORY PERSONALIZATION: Determine time of day boost
  const currentHour = new Date().getHours();
  let timeOfDayBoost = 0;
  
  if (currentHour >= 6 && currentHour < 12) {
    // Morning
    if (memory.energyPattern.morning > 0.6) {
      timeOfDayBoost = 0.2; // Boost morning tasks
    }
  } else if (currentHour >= 12 && currentHour < 18) {
    // Afternoon
    if (memory.energyPattern.afternoon > 0.6) {
      timeOfDayBoost = 0.2;
    }
  } else {
    // Night
    if (memory.energyPattern.night > 0.6) {
      timeOfDayBoost = 0.2;
    }
  }
  
  // Create a map of tasks with combined priority scores
  const taskPriorityMap = new Map<string, number>();
  for (const task of tasks) {
    if (!task.id) continue;
    const score = scoreMap.get(task.id);
    if (!score) continue;
    
    // Combine current priority score with future_priority_score
    const basePriorityScore = score.priority === 'MUST' ? 1.0 : score.priority === 'SHOULD' ? 0.6 : 0.3;
    const futurePriorityScore = task.future_priority_score || 0;
    let combinedScore = basePriorityScore * 0.6 + futurePriorityScore * 0.4;
    
    // MEMORY PERSONALIZATION: Apply energy pattern boost
    if (timeOfDayBoost > 0) {
      combinedScore += timeOfDayBoost;
    }
    
    // MEMORY PERSONALIZATION: Reduce priority if category is in procrastination triggers
    if (task.category && memory.procrastinationTriggers.includes(task.category)) {
      combinedScore *= 0.7; // Gentle reduction for procrastinated categories
    }
    
    taskPriorityMap.set(task.id, combinedScore);
  }
  
  // Second pass: route tasks with explicit deadlines
  const remainingTasks: Task[] = [];
  
  for (const task of tasks) {
    if (!task.id) continue;
    
    // Skip primary focus tasks (already handled)
    if (primaryFocusTasks.includes(task.id)) continue;
    
    const score = scoreMap.get(task.id);
    if (!score) continue;
    
    const deadline = deadlineMap.get(task.id);
    
    // Handle explicit deadlines first
    if (deadline) {
      if (isOverdue(deadline)) {
        // Overdue tasks go to today with high priority
        if (todayCount < MAX_TODAY_TASKS) {
          routing.today.push(task.id);
          todayCount++;
        } else {
          // If today is full, push to tomorrow
          routing.tomorrow.push(task.id);
        }
        continue;
      }
      
      const bucket = getDateBucket(deadline);
      if (bucket === 'today' && todayCount >= MAX_TODAY_TASKS) {
        // Today is full, move to tomorrow
        routing.tomorrow.push(task.id);
      } else {
        routing[bucket].push(task.id);
        if (bucket === 'today') todayCount++;
      }
      continue;
    }
    
    // Handle tasks with reminder times
    if (task.reminder_time) {
      const reminderDate = new Date(task.reminder_time);
      const bucket = getDateBucket(reminderDate.toISOString());
      if (bucket === 'today' && todayCount >= MAX_TODAY_TASKS) {
        routing.tomorrow.push(task.id);
      } else {
        routing[bucket].push(task.id);
        if (bucket === 'today') todayCount++;
      }
      continue;
    }
    
    // Tasks without explicit deadlines - save for priority-based routing
    remainingTasks.push(task);
  }
  
  // Third pass: Sort remaining tasks by combined priority score and route
  remainingTasks.sort((a, b) => {
    const scoreA = taskPriorityMap.get(a.id!) || 0;
    const scoreB = taskPriorityMap.get(b.id!) || 0;
    return scoreB - scoreA; // Higher scores first
  });
  
  for (const task of remainingTasks) {
    if (!task.id) continue;
    const score = scoreMap.get(task.id);
    if (!score) continue;
    
    // Route by priority and characteristics
    const bucket = routeTaskByPriority(
      score.priority,
      score.big_task,
      score.fiesta_ready
    );
    
    // Apply capacity limits for "today"
    if (bucket === 'today' && todayCount >= MAX_TODAY_TASKS) {
      // If fiesta_ready and today is full, still add it (quick wins)
      if (score.fiesta_ready) {
        routing.today.push(task.id);
        todayCount++;
      } else {
        // Otherwise push to tomorrow
        routing.tomorrow.push(task.id);
      }
    } else {
      routing[bucket].push(task.id);
      if (bucket === 'today') todayCount++;
    }
  }
  
  // Ensure primary focus tasks are at the start of today
  routing.today = [...primaryFocusTasks, ...routing.today.filter(id => !primaryFocusTasks.includes(id))];
  
  return routing;
}

/**
 * Apply related task suggestions to tasks by moving them to suggested buckets
 */
export function applyRelatedTaskSuggestions(
  tasks: Task[],
  suggestions: RelatedTaskSuggestion[]
): Task[] {
  const updatedTasks = [...tasks];
  const suggestionMap = new Map(suggestions.map(s => [s.task_id, s.suggested_bucket]));

  return updatedTasks.map(task => {
    if (!task.id || !suggestionMap.has(task.id)) return task;

    const suggestedBucket = suggestionMap.get(task.id)!;
    
    // For "today" suggestions, set as focus task
    if (suggestedBucket === 'today') {
      return {
        ...task,
        is_focus: true,
        focus_date: new Date().toISOString().split('T')[0],
      };
    }
    
    // For "this_week" suggestions, add context
    if (suggestedBucket === 'this_week') {
      return {
        ...task,
        context: task.context 
          ? `${task.context} (Related to primary focus)`
          : 'Related to primary focus',
      };
    }

    return task;
  });
}
