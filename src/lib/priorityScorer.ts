interface Task {
  id?: string;
  title: string;
  category?: string;
  is_focus?: boolean;
}

interface IdeaAnalysis {
  summary: string;
  topics: string[];
  insights: string[];
  decisions: string[];
  ideas: string[];
  followups: string[];
  questions: string[];
  emotional_tone: 'neutral' | 'overwhelmed' | 'focused' | 'stressed';
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

const EFFORT_INDICATORS = {
  tiny: ['quick', 'check', 'send', 'call', 'text', 'reply', 'respond', 'email', 'message'],
  small: ['review', 'draft', 'update', 'schedule', 'book', 'order', 'buy'],
  medium: ['write', 'create', 'prepare', 'plan', 'organize', 'meeting', 'research'],
  large: ['build', 'develop', 'implement', 'design', 'complete', 'finish project', 'overhaul'],
};

const PRIORITY_KEYWORDS = {
  MUST: ['urgent', 'asap', 'critical', 'immediately', 'today', 'now', 'emergency', 'deadline'],
  SHOULD: ['important', 'soon', 'this week', 'tomorrow', 'need to', 'should'],
  COULD: ['maybe', 'consider', 'eventually', 'sometime', 'would be nice', 'if time'],
};

function estimateEffort(taskText: string): 'tiny' | 'small' | 'medium' | 'large' {
  const lowerText = taskText.toLowerCase();
  
  // Check for explicit time mentions
  if (/\b(\d+)\s*(min|minute|minutes)\b/i.test(lowerText)) {
    const match = lowerText.match(/\b(\d+)\s*(min|minute|minutes)\b/i);
    if (match) {
      const minutes = parseInt(match[1]);
      if (minutes <= 5) return 'tiny';
      if (minutes <= 15) return 'small';
      if (minutes <= 30) return 'medium';
      return 'large';
    }
  }
  
  if (/\b(\d+)\s*(hour|hours|hr|hrs)\b/i.test(lowerText)) {
    return 'large';
  }
  
  // Check effort indicators
  for (const [effort, keywords] of Object.entries(EFFORT_INDICATORS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return effort as 'tiny' | 'small' | 'medium' | 'large';
      }
    }
  }
  
  // Check task length as a heuristic
  const wordCount = taskText.split(/\s+/).length;
  if (wordCount <= 3) return 'tiny';
  if (wordCount <= 6) return 'small';
  if (wordCount <= 10) return 'medium';
  return 'large';
}

function determinePriority(
  task: Task,
  contextMap: ContextMap,
  ideaAnalysis: IdeaAnalysis
): 'MUST' | 'SHOULD' | 'COULD' {
  const lowerText = task.title.toLowerCase();
  
  // Primary focus tasks are always MUST priority
  if (task.category === 'primary_focus' && task.is_focus) {
    return 'MUST';
  }
  
  // Check for explicit priority keywords
  for (const keyword of PRIORITY_KEYWORDS.MUST) {
    if (lowerText.includes(keyword)) return 'MUST';
  }
  
  // Check time sensitivity from context
  if (task.id) {
    const sensitivity = contextMap.time_sensitivity.find(ts => ts.task_id === task.id);
    if (sensitivity?.urgency === 'high') return 'MUST';
    
    const deadline = contextMap.implied_deadlines.find(d => d.task_id === task.id);
    if (deadline) {
      const deadlineDate = new Date(deadline.deadline);
      const now = new Date();
      const hoursUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntil <= 24) return 'MUST';
      if (hoursUntil <= 72) return 'SHOULD';
    }
  }
  
  // Check emotional tone
  if (ideaAnalysis.emotional_tone === 'stressed' || ideaAnalysis.emotional_tone === 'overwhelmed') {
    // Tasks mentioned during stressed state are likely important
    return 'SHOULD';
  }
  
  // Check for SHOULD keywords
  for (const keyword of PRIORITY_KEYWORDS.SHOULD) {
    if (lowerText.includes(keyword)) return 'SHOULD';
  }
  
  // Check for COULD keywords
  for (const keyword of PRIORITY_KEYWORDS.COULD) {
    if (lowerText.includes(keyword)) return 'COULD';
  }
  
  // Check if part of decisions or followups
  const isDecision = ideaAnalysis.decisions?.some(d => 
    d.toLowerCase().includes(task.title.toLowerCase().substring(0, 15))
  );
  if (isDecision) return 'MUST';
  
  const isFollowup = ideaAnalysis.followups?.some(f => 
    f.toLowerCase().includes(task.title.toLowerCase().substring(0, 15))
  );
  if (isFollowup) return 'SHOULD';
  
  // Default
  return 'SHOULD';
}

export function priorityScorer(
  extractedTasks: Task[],
  ideaAnalysis: IdeaAnalysis,
  contextMap?: ContextMap
): TaskScore[] {
  const tasks = extractedTasks || [];
  const analysis = ideaAnalysis || {
    summary: '',
    topics: [],
    insights: [],
    decisions: [],
    ideas: [],
    followups: [],
    questions: [],
    emotional_tone: 'neutral' as const,
  };
  
  const context = contextMap || {
    projects: [],
    categories: [],
    people_mentions: [],
    implied_deadlines: [],
    time_sensitivity: [],
  };
  
  return tasks
    .filter(task => task.id)
    .map(task => {
      const effort = estimateEffort(task.title);
      const priority = determinePriority(task, context, analysis);
      
      const fiesta_ready = effort === 'tiny';
      const big_task = effort === 'large';
      
      return {
        task_id: task.id!,
        priority,
        effort,
        fiesta_ready,
        big_task,
      };
    });
}
