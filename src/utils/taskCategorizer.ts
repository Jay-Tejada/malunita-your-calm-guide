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

// Enhanced analysis types
export interface TaskAnalysis {
  type: TaskType;
  cognitiveLoad: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  isStale: boolean;
  isAvoided: boolean;
  staleDays: number;
  postponeCount: number;
}

export interface FlowSession {
  id: string;
  type: 'tiny_task_fiesta' | 'focus_block' | 'admin_hour' | 'avoidance_buster' | 'communication_batch';
  label: string;
  description: string;
  tasks: any[];
  estimatedMinutes: number;
  icon: string;
}

export const analyzeTask = (task: {
  title: string;
  created_at: string;
  scheduled_date?: string;
  postpone_count?: number;
}): TaskAnalysis => {
  const type = categorizeTask(task.title);
  const t = task.title.toLowerCase();
  
  // Cognitive load scoring
  let cognitiveLoad: 'low' | 'medium' | 'high' = 'medium';
  
  // Low cognitive load indicators
  if (/\b(check|confirm|send|reply|quick|simple|just)\b/.test(t) || task.title.length < 30) {
    cognitiveLoad = 'low';
  }
  
  // High cognitive load indicators
  if (/\b(create|design|write|plan|strategy|analyze|research|think|decide|figure out|complex|review.*and)\b/.test(t)) {
    cognitiveLoad = 'high';
  }
  
  // Estimate minutes based on type + cognitive load
  const baseMinutes = estimateMinutes(type);
  const loadMultiplier = { low: 0.7, medium: 1, high: 1.5 };
  const estimatedMinutes = Math.round(baseMinutes * loadMultiplier[cognitiveLoad]);
  
  // Staleness (days since created)
  const createdDate = new Date(task.created_at);
  const now = new Date();
  const staleDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = staleDays > 7;
  
  // Avoidance detection
  const postponeCount = task.postpone_count || 0;
  const isAvoided = postponeCount >= 3 || staleDays > 14;
  
  return {
    type,
    cognitiveLoad,
    estimatedMinutes,
    isStale,
    isAvoided,
    staleDays,
    postponeCount,
  };
};

// Group tasks into flow sessions
export const generateFlowSessions = (tasks: any[]): FlowSession[] => {
  const sessions: FlowSession[] = [];
  const analyzed = tasks.map(t => ({ ...t, analysis: analyzeTask(t) }));
  
  // 1. Tiny Task Fiesta (low cognitive, quick tasks)
  const tinyTasks = analyzed.filter(t => 
    t.analysis.cognitiveLoad === 'low' && 
    t.analysis.estimatedMinutes <= 5
  );
  if (tinyTasks.length >= 3) {
    sessions.push({
      id: 'tiny-tasks',
      type: 'tiny_task_fiesta',
      label: 'Tiny Task Fiesta',
      description: `Clear ${tinyTasks.length} quick tasks`,
      tasks: tinyTasks,
      estimatedMinutes: tinyTasks.reduce((sum, t) => sum + t.analysis.estimatedMinutes, 0),
      icon: 'zap',
    });
  }
  
  // 2. Focus Block (high cognitive, deep work)
  const deepTasks = analyzed.filter(t => 
    t.analysis.type === 'deep_work' || 
    t.analysis.cognitiveLoad === 'high'
  );
  if (deepTasks.length >= 1) {
    sessions.push({
      id: 'focus-block',
      type: 'focus_block',
      label: 'Focus Block',
      description: 'Deep work requiring concentration',
      tasks: deepTasks.slice(0, 3),
      estimatedMinutes: 45,
      icon: 'target',
    });
  }
  
  // 3. Admin Hour (admin tasks)
  const adminTasks = analyzed.filter(t => t.analysis.type === 'admin');
  if (adminTasks.length >= 3) {
    sessions.push({
      id: 'admin-hour',
      type: 'admin_hour',
      label: 'Admin Hour',
      description: 'Life maintenance tasks',
      tasks: adminTasks,
      estimatedMinutes: adminTasks.reduce((sum, t) => sum + t.analysis.estimatedMinutes, 0),
      icon: 'clipboard',
    });
  }
  
  // 4. Avoidance Buster (tasks you've been putting off)
  const avoidedTasks = analyzed.filter(t => t.analysis.isAvoided);
  if (avoidedTasks.length >= 2) {
    sessions.push({
      id: 'avoidance-buster',
      type: 'avoidance_buster',
      label: 'Avoidance Buster',
      description: `${avoidedTasks.length} tasks you've been putting off`,
      tasks: avoidedTasks,
      estimatedMinutes: avoidedTasks.reduce((sum, t) => sum + t.analysis.estimatedMinutes, 0),
      icon: 'alert-triangle',
    });
  }
  
  // 5. Communication Batch (communication tasks)
  const commTasks = analyzed.filter(t => t.analysis.type === 'communication');
  if (commTasks.length >= 3) {
    sessions.push({
      id: 'comms-batch',
      type: 'communication_batch',
      label: 'Communication Batch',
      description: `Clear ${commTasks.length} messages`,
      tasks: commTasks,
      estimatedMinutes: commTasks.reduce((sum, t) => sum + t.analysis.estimatedMinutes, 0),
      icon: 'message-square',
    });
  }
  
  return sessions;
};

// Get cognitive load color
export const getCognitiveLoadColor = (load: 'low' | 'medium' | 'high'): string => {
  const colors = {
    low: 'text-green-500/60',
    medium: 'text-amber-500/60',
    high: 'text-red-500/60',
  };
  return colors[load];
};

// Get staleness indicator
export const getStalenessIndicator = (days: number): string => {
  if (days <= 3) return '';
  if (days <= 7) return '·';
  if (days <= 14) return '··';
  return '···';
};
