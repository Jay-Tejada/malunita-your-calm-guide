/**
 * Task Type Classifier
 * Computes virtual fields for tasks without modifying the database schema
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
  task_type: TaskType;
  tiny_task: boolean;
  heavy_task: boolean;
  emotional_weight: number; // 0-10 scale
}

// Keywords for each task type
const TASK_TYPE_PATTERNS: Record<TaskType, string[]> = {
  admin: [
    'file', 'paperwork', 'form', 'invoice', 'receipt', 'tax', 'budget',
    'organize', 'schedule', 'calendar', 'appointment', 'register', 'document',
    'renew', 'license', 'insurance', 'billing'
  ],
  communication: [
    'email', 'call', 'text', 'message', 'reply', 'respond', 'reach out',
    'contact', 'phone', 'slack', 'meeting', 'zoom', 'discuss', 'follow up',
    'check in', 'update', 'notify', 'send', 'share'
  ],
  errand: [
    'buy', 'shop', 'pick up', 'drop off', 'get', 'purchase', 'store',
    'grocery', 'pharmacy', 'post office', 'mail', 'package', 'deliver',
    'return', 'exchange', 'gas', 'fuel', 'bank'
  ],
  focus: [
    'write', 'code', 'design', 'plan', 'strategy', 'analyze', 'research',
    'develop', 'build', 'create project', 'deep work', 'concentrate',
    'study', 'learn', 'review', 'draft', 'proposal', 'report'
  ],
  physical: [
    'workout', 'exercise', 'gym', 'run', 'walk', 'yoga', 'clean', 'fix',
    'repair', 'install', 'move', 'lift', 'organize space', 'declutter',
    'laundry', 'dishes', 'cook', 'meal prep'
  ],
  creative: [
    'brainstorm', 'design', 'sketch', 'draw', 'paint', 'write creatively',
    'compose', 'music', 'video', 'photo', 'edit', 'create content',
    'ideate', 'imagine', 'craft', 'art', 'prototype'
  ],
  delivery: [
    'ship', 'send out', 'submit', 'publish', 'deploy', 'launch', 'release',
    'finalize', 'complete', 'hand off', 'deliver', 'present', 'share final'
  ],
  follow_up: [
    'follow up', 'check on', 'remind', 'revisit', 'chase', 'ping',
    'follow through', 'confirm', 'verify', 'ensure', 'double check'
  ]
};

// Tiny task indicators (< 3 minutes)
const TINY_TASK_PATTERNS = [
  'quick', 'quick check', 'briefly', 'fast', 'just', 'simply',
  'send email', 'reply', 'text', 'call', 'check', 'verify',
  'confirm', 'ack', 'acknowledge', 'approve', 'sign off'
];

// Heavy task indicators (long, deep work)
const HEAVY_TASK_PATTERNS = [
  'project', 'complete', 'finish', 'comprehensive', 'full', 'entire',
  'overhaul', 'revamp', 'redesign', 'rebuild', 'major', 'strategic',
  'plan out', 'research and', 'develop', 'build from scratch',
  'analyze deeply', 'deep dive'
];

// Emotional weight keywords
const EMOTIONAL_WEIGHT_PATTERNS = {
  high: [
    'urgent', 'asap', 'critical', 'important', 'stressed', 'worried',
    'anxious', 'overwhelmed', 'panic', 'pressure', 'deadline', 'must',
    'need to', 'have to', 'scared', 'nervous', 'dreading'
  ],
  medium: [
    'should', 'would like', 'prefer', 'hoping', 'trying', 'want to',
    'need', 'required', 'necessary', 'concerned', 'unsure'
  ]
};

/**
 * Classify task type based on content
 */
export function classifyTaskType(taskText: string): TaskType {
  const lowerText = taskText.toLowerCase();
  
  // Score each type
  const scores: Record<TaskType, number> = {
    admin: 0,
    communication: 0,
    errand: 0,
    focus: 0,
    physical: 0,
    creative: 0,
    delivery: 0,
    follow_up: 0
  };

  // Check patterns for each type
  for (const [type, patterns] of Object.entries(TASK_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        scores[type as TaskType]++;
      }
    }
  }

  // Return the type with highest score
  const entries = Object.entries(scores) as [TaskType, number][];
  entries.sort((a, b) => b[1] - a[1]);
  
  // If no clear type, default based on length
  if (entries[0][1] === 0) {
    // Short tasks default to communication
    if (lowerText.split(' ').length <= 5) {
      return 'communication';
    }
    // Longer tasks default to focus
    return 'focus';
  }

  return entries[0][0];
}

/**
 * Detect if task is tiny (< 3 minutes)
 */
export function isTinyTask(taskText: string): boolean {
  const lowerText = taskText.toLowerCase();
  const wordCount = taskText.trim().split(/\s+/).length;
  
  // Very short tasks are likely tiny
  if (wordCount <= 3) {
    return true;
  }

  // Check for tiny task patterns
  for (const pattern of TINY_TASK_PATTERNS) {
    if (lowerText.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if task is heavy (long, deep work)
 */
export function isHeavyTask(taskText: string): boolean {
  const lowerText = taskText.toLowerCase();
  const wordCount = taskText.trim().split(/\s+/).length;
  
  // Very long descriptions suggest complexity
  if (wordCount > 15) {
    return true;
  }

  // Check for heavy task patterns
  for (const pattern of HEAVY_TASK_PATTERNS) {
    if (lowerText.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate emotional weight (0-10 scale)
 */
export function calculateEmotionalWeight(taskText: string): number {
  const lowerText = taskText.toLowerCase();
  let weight = 0;

  // Check high-weight patterns
  for (const pattern of EMOTIONAL_WEIGHT_PATTERNS.high) {
    if (lowerText.includes(pattern)) {
      weight += 3;
    }
  }

  // Check medium-weight patterns
  for (const pattern of EMOTIONAL_WEIGHT_PATTERNS.medium) {
    if (lowerText.includes(pattern)) {
      weight += 1;
    }
  }

  // Cap at 10
  return Math.min(weight, 10);
}

/**
 * Compute all virtual flags for a task
 */
export function computeVirtualFlags(taskText: string): VirtualTaskFlags {
  return {
    task_type: classifyTaskType(taskText),
    tiny_task: isTinyTask(taskText),
    heavy_task: isHeavyTask(taskText),
    emotional_weight: calculateEmotionalWeight(taskText)
  };
}
