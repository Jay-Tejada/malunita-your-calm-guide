import { Task } from "@/hooks/useTasks";
import { useCognitiveLoad } from "@/state/cognitiveLoad";

export type WorkloadSuggestion = {
  id: string;
  type: 'move_out' | 'pull_in';
  taskId: string;
  taskTitle: string;
  fromBucket: string;
  toBucket: string;
  reason: string;
  priority: number;
};

export type TaskBucket = {
  today: Task[];
  thisWeek: Task[];
  soon: Task[];
};

/**
 * Analyze task distribution across buckets
 */
export function analyzeTaskDistribution(tasks: Task[]): TaskBucket {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const buckets: TaskBucket = {
    today: [],
    thisWeek: [],
    soon: [],
  };

  tasks.forEach(task => {
    if (task.completed) return;
    
    const focusDate = task.focus_date;
    
    if (focusDate === today || (task.is_focus && !focusDate)) {
      buckets.today.push(task);
    } else if (focusDate && new Date(focusDate) <= weekFromNow) {
      buckets.thisWeek.push(task);
    } else {
      buckets.soon.push(task);
    }
  });

  return buckets;
}

/**
 * Calculate priority score for a task
 * Lower score = lower priority (candidate for moving out)
 */
function calculateTaskPriority(task: Task): number {
  let score = 50; // Base score

  // Time-sensitive tasks get higher priority
  if (task.is_time_based || task.has_reminder) score += 30;
  
  // Tasks with deadlines (focus_date) get higher priority
  if (task.focus_date) score += 20;
  
  // Goal-aligned tasks get higher priority
  if (task.goal_aligned) score += 15;
  
  // Tasks with people get higher priority
  if (task.has_person_name) score += 10;
  
  // Categorized tasks (not inbox) get slight priority
  if (task.category && task.category !== 'inbox') score += 5;

  // Longer/more complex tasks get lower priority (easier to move)
  const wordCount = task.title.split(/\s+/).length;
  if (wordCount > 10) score -= 10;
  if (wordCount < 4) score += 5; // Quick tasks stay

  return score;
}

/**
 * Generate workload balancing suggestions
 */
export function generateWorkloadSuggestions(
  tasks: Task[],
  cognitiveLoadLevel: 'LOW' | 'MEDIUM' | 'HIGH'
): WorkloadSuggestion[] {
  const buckets = analyzeTaskDistribution(tasks);
  const suggestions: WorkloadSuggestion[] = [];
  
  const todayCount = buckets.today.length;
  const thisWeekCount = buckets.thisWeek.length;
  
  // Rule 1: Today is overloaded (>7 tasks OR high cognitive load)
  const isOverloaded = todayCount > 7 || cognitiveLoadLevel === 'HIGH';
  
  if (isOverloaded && todayCount > 0) {
    // Find low-priority tasks to move out
    const sortedTodayTasks = [...buckets.today].sort((a, b) => 
      calculateTaskPriority(a) - calculateTaskPriority(b)
    );
    
    const tasksToMove = sortedTodayTasks.slice(0, Math.min(3, Math.ceil(todayCount * 0.3)));
    
    tasksToMove.forEach((task, index) => {
      const priority = calculateTaskPriority(task);
      const targetBucket = priority < 40 ? 'soon' : 'thisWeek';
      
      suggestions.push({
        id: `move-out-${task.id}`,
        type: 'move_out',
        taskId: task.id,
        taskTitle: task.title,
        fromBucket: 'today',
        toBucket: targetBucket,
        reason: cognitiveLoadLevel === 'HIGH'
          ? 'Cognitive load is high — this can wait'
          : 'Today is packed — consider moving this',
        priority: 100 - priority,
      });
    });
  }
  
  // Rule 2: Today is underutilized (<3 tasks AND not overloaded)
  if (todayCount < 3 && !isOverloaded && thisWeekCount > 0) {
    // Find high-priority tasks from this week to pull in
    const sortedWeekTasks = [...buckets.thisWeek].sort((a, b) => 
      calculateTaskPriority(b) - calculateTaskPriority(a)
    );
    
    const tasksToPullIn = sortedWeekTasks.slice(0, Math.min(2, 3 - todayCount));
    
    tasksToPullIn.forEach(task => {
      suggestions.push({
        id: `pull-in-${task.id}`,
        type: 'pull_in',
        taskId: task.id,
        taskTitle: task.title,
        fromBucket: 'thisWeek',
        toBucket: 'today',
        reason: 'You have capacity — want to tackle this today?',
        priority: calculateTaskPriority(task),
      });
    });
  }
  
  // Sort by priority (descending)
  suggestions.sort((a, b) => b.priority - a.priority);
  
  // Limit to top 3 suggestions
  return suggestions.slice(0, 3);
}

/**
 * Hook to get workload suggestions
 */
export function useWorkloadSuggestions(tasks: Task[] | undefined): WorkloadSuggestion[] {
  const { level } = useCognitiveLoad();
  
  if (!tasks || tasks.length === 0) return [];
  
  return generateWorkloadSuggestions(tasks, level);
}
