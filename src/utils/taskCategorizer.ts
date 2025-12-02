export type TaskType = 
  | 'communication' 
  | 'deep_work' 
  | 'admin' 
  | 'errands' 
  | 'quick_task'
  | 'general';

export const categorizeTask = (title: string): TaskType => {
  const t = title.toLowerCase();
  
  // Communication
  if (/\b(email|call|text|message|respond|reply|reach out|contact|follow up with|check in with|tell|ask)\b/.test(t)) {
    return 'communication';
  }
  
  // Deep Work
  if (/\b(write|create|design|build|develop|plan|strategy|research|analyze|draft|prepare|think about|brainstorm|outline)\b/.test(t)) {
    return 'deep_work';
  }
  
  // Admin
  if (/\b(schedule|book|order|pay|renew|update|file|organize|cancel|submit|register|sign up|fill out|review.*form)\b/.test(t)) {
    return 'admin';
  }
  
  // Errands
  if (/\b(buy|pick up|drop off|return|go to|stop by|grab|get.*from|bring)\b/.test(t)) {
    return 'errands';
  }
  
  // Quick tasks (short titles or quick action words)
  if (title.length < 35 || /\b(check|confirm|send|look at|glance|quick)\b/.test(t)) {
    return 'quick_task';
  }
  
  return 'general';
};

export const getTaskTypeLabel = (type: TaskType): string => {
  const labels: Record<TaskType, string> = {
    communication: 'Communication',
    deep_work: 'Deep Work',
    admin: 'Admin',
    errands: 'Errands',
    quick_task: 'Quick Task',
    general: 'General',
  };
  return labels[type];
};

export const getTaskTypeIcon = (type: TaskType): string => {
  const icons: Record<TaskType, string> = {
    communication: '💬',
    deep_work: '🎯',
    admin: '📋',
    errands: '🚗',
    quick_task: '⚡',
    general: '○',
  };
  return icons[type];
};

export const estimateMinutes = (type: TaskType): number => {
  const estimates: Record<TaskType, number> = {
    communication: 5,
    deep_work: 45,
    admin: 10,
    errands: 20,
    quick_task: 3,
    general: 15,
  };
  return estimates[type];
};
