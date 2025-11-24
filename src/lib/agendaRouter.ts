interface Task {
  id?: string;
  title: string;
  category?: string;
  reminder_time?: string | null;
  is_focus?: boolean;
  focus_date?: string | null;
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

interface AgendaRouting {
  today: string[];
  tomorrow: string[];
  this_week: string[];
  upcoming: string[];
  someday: string[];
}

const MAX_TODAY_TASKS = 8; // Limit for "today" bucket to avoid overwhelming

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
  for (const task of tasks) {
    if (!task.id) continue;
    
    const today = new Date().toISOString().split('T')[0];
    if (task.category === 'primary_focus' && task.is_focus && task.focus_date === today) {
      primaryFocusTasks.push(task.id);
      todayCount++;
    }
  }
  
  // Second pass: route tasks with explicit deadlines
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
