import { Task } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { useMemoryEngine } from '@/state/memoryEngine';

// Simple admin task keywords that indicate tiny tasks
const TINY_TASK_KEYWORDS = [
  'pay', 'send', 'check', 'renew', 'schedule', 'reply', 'email',
  'call', 'text', 'message', 'confirm', 'verify', 'submit',
  'upload', 'download', 'forward', 'respond', 'acknowledge',
  'approve', 'review', 'sign', 'file', 'update', 'quick'
];

// Keywords that suggest longer tasks
const BIG_TASK_KEYWORDS = [
  'research', 'analyze', 'design', 'develop', 'implement', 'create',
  'build', 'write', 'draft', 'plan', 'strategy', 'meeting', 'presentation'
];

export interface TinyTaskClassification {
  isTiny: boolean;
  confidence: number;
  reason: string;
}

/**
 * Classifies a task as tiny or big using AI (with fallback to heuristics)
 */
export const classifyTaskWithAI = async (task: Task): Promise<TinyTaskClassification> => {
  try {
    const { data, error } = await supabase.functions.invoke('classify-tiny-task', {
      body: {
        taskTitle: task.title,
        taskContext: task.context
      }
    });

    if (error) throw error;

    return {
      isTiny: data.is_tiny_task,
      confidence: data.is_tiny_task ? 0.9 : 0.2,
      reason: data.reason
    };
  } catch (error) {
    console.error('AI classification failed, using heuristics:', error);
    return classifyTask(task);
  }
};

/**
 * Classifies a task as tiny or big based on simple heuristics (fallback)
 */
export const classifyTask = (task: Task): TinyTaskClassification => {
  const titleLower = task.title.toLowerCase();
  const contextLower = task.context?.toLowerCase() || '';
  const fullText = `${titleLower} ${contextLower}`;

  // Get memory profile for personalization
  const memory = useMemoryEngine.getState();
  
  // MEMORY PERSONALIZATION: Use learned threshold
  const memoryThreshold = memory.tinyTaskThreshold;
  const titleLength = task.title.length;

  // Check for tiny task keywords
  const hasTinyKeywords = TINY_TASK_KEYWORDS.some(keyword => 
    fullText.includes(keyword)
  );

  // Check for big task keywords
  const hasBigKeywords = BIG_TASK_KEYWORDS.some(keyword => 
    fullText.includes(keyword)
  );

  // Short titles are often tiny tasks - adjusted by memory
  const wordCount = task.title.split(' ').length;
  const isShortTitle = wordCount <= 5;

  // Time-based tasks are often administrative
  const isTimeBased = task.is_time_based;

  // Calculate confidence
  let confidence = 0;
  let reason = '';

  if (hasBigKeywords) {
    confidence = 0.1;
    reason = 'Contains keywords suggesting complex work';
  } else if (hasTinyKeywords && isShortTitle) {
    confidence = 0.9;
    reason = 'Quick admin action with clear intent';
  } else if (hasTinyKeywords) {
    confidence = 0.7;
    reason = 'Administrative action detected';
  } else if (isShortTitle && isTimeBased) {
    confidence = 0.6;
    reason = 'Short time-based task';
  } else if (isShortTitle) {
    confidence = 0.5;
    reason = 'Brief task description';
  } else {
    confidence = 0.3;
    reason = 'May require more time or focus';
  }
  
  // MEMORY PERSONALIZATION: Adjust confidence based on learned threshold
  if (memoryThreshold && memoryThreshold < 10) {
    // User has low threshold - classify more aggressively as tiny
    if (titleLength <= memoryThreshold) {
      confidence = Math.min(1.0, confidence + 0.3);
      reason += ' (Matches your typical tiny task length)';
    }
  }

  return {
    isTiny: confidence >= 0.5,
    confidence,
    reason
  };
};

/**
 * Filters a list of tasks to find tiny tasks
 */
export const findTinyTasks = (tasks: Task[]): Task[] => {
  return tasks
    .filter(task => !task.completed)
    .filter(task => {
      const classification = classifyTask(task);
      return classification.isTiny;
    })
    .sort((a, b) => {
      // Sort by confidence (higher first)
      const aClass = classifyTask(a);
      const bClass = classifyTask(b);
      return bClass.confidence - aClass.confidence;
    });
};

/**
 * Checks if user has enough tiny tasks to suggest a fiesta
 */
export const shouldSuggestFiesta = (tasks: Task[], minTasks = 5): boolean => {
  const tinyTasks = findTinyTasks(tasks);
  return tinyTasks.length >= minTasks;
};
