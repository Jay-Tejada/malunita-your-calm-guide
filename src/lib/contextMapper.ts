import { useMemoryEngine } from '@/state/memoryEngine';

interface Task {
  id?: string;
  title: string;
  category?: string;
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

const DEADLINE_PATTERNS = [
  { pattern: /\b(today|asap|now|urgent)\b/i, offset: 0 },
  { pattern: /\b(tomorrow)\b/i, offset: 1 },
  { pattern: /\b(by friday|this friday)\b/i, type: 'friday' },
  { pattern: /\b(this week|by week end)\b/i, type: 'week_end' },
  { pattern: /\b(next week)\b/i, offset: 7 },
  { pattern: /\b(by monday|this monday)\b/i, type: 'monday' },
];

const URGENCY_KEYWORDS = {
  high: ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'now', 'today'],
  medium: ['soon', 'important', 'this week', 'tomorrow', 'need to'],
  low: ['eventually', 'sometime', 'maybe', 'consider', 'might'],
};

const CATEGORY_KEYWORDS = {
  work: ['meeting', 'project', 'deadline', 'client', 'office', 'presentation', 'report'],
  home: ['clean', 'repair', 'fix', 'organize', 'laundry', 'dishes'],
  personal: ['exercise', 'health', 'hobby', 'read', 'learn'],
  errand: ['buy', 'pick up', 'drop off', 'return', 'get', 'shop'],
  call: ['call', 'phone', 'reach out', 'contact', 'text'],
  project: ['build', 'create', 'develop', 'design', 'implement'],
};

function extractPeopleMentions(text: string): string[] {
  const namePattern = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g;
  const matches = text.match(namePattern) || [];
  return [...new Set(matches)].filter(name => 
    name.length > 2 && !['Today', 'Tomorrow', 'Friday', 'Monday', 'Week'].includes(name)
  );
}

function inferDeadline(taskText: string): string | null {
  const now = new Date();
  
  for (const { pattern, offset, type } of DEADLINE_PATTERNS) {
    if (pattern.test(taskText)) {
      if (offset !== undefined) {
        const deadline = new Date(now);
        deadline.setDate(deadline.getDate() + offset);
        return deadline.toISOString();
      }
      
      if (type === 'friday') {
        const deadline = new Date(now);
        const daysUntilFriday = (5 - deadline.getDay() + 7) % 7;
        deadline.setDate(deadline.getDate() + (daysUntilFriday || 7));
        return deadline.toISOString();
      }
      
      if (type === 'week_end') {
        const deadline = new Date(now);
        const daysUntilSunday = (7 - deadline.getDay()) % 7;
        deadline.setDate(deadline.getDate() + daysUntilSunday);
        return deadline.toISOString();
      }
      
      if (type === 'monday') {
        const deadline = new Date(now);
        const daysUntilMonday = (1 - deadline.getDay() + 7) % 7;
        deadline.setDate(deadline.getDate() + (daysUntilMonday || 7));
        return deadline.toISOString();
      }
    }
  }
  
  return null;
}

function detectUrgency(taskText: string, emotionalTone: string): 'high' | 'medium' | 'low' {
  const lowerText = taskText.toLowerCase();
  
  if (emotionalTone === 'stressed' || emotionalTone === 'overwhelmed') {
    return 'high';
  }
  
  for (const keyword of URGENCY_KEYWORDS.high) {
    if (lowerText.includes(keyword)) return 'high';
  }
  
  for (const keyword of URGENCY_KEYWORDS.medium) {
    if (lowerText.includes(keyword)) return 'medium';
  }
  
  for (const keyword of URGENCY_KEYWORDS.low) {
    if (lowerText.includes(keyword)) return 'low';
  }
  
  return 'medium';
}

function inferCategory(taskText: string): string {
  const lowerText = taskText.toLowerCase();
  
  // Get memory profile for personalization
  const memory = useMemoryEngine.getState();
  
  let bestCategory = 'personal';
  let bestScore = 0;
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        // MEMORY PERSONALIZATION: Adjust confidence based on category preferences
        let score = 1.0;
        const preference = memory.categoryPreferences[category];
        
        if (preference !== undefined) {
          if (preference < 0.2) {
            // User rarely completes this category - reduce confidence
            score = 0.3;
          } else if (preference > 0.7) {
            // User loves this category - boost confidence
            score = 1.5;
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }
    }
  }
  
  return bestCategory;
}

function inferProjects(tasks: Task[], topics: string[]): Array<{ name: string; task_ids: string[] }> {
  const projectMap = new Map<string, string[]>();
  
  // Group by explicit topics
  for (const topic of topics) {
    const relatedTaskIds = tasks
      .filter(task => {
        const taskLower = task.title.toLowerCase();
        const topicLower = topic.toLowerCase();
        return taskLower.includes(topicLower);
      })
      .map(task => task.id || '')
      .filter(id => id);
    
    if (relatedTaskIds.length > 0) {
      projectMap.set(topic, relatedTaskIds);
    }
  }
  
  // Group by common keywords in task titles
  const keywords = new Map<string, string[]>();
  for (const task of tasks) {
    const words = task.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    for (const word of words) {
      if (!keywords.has(word)) {
        keywords.set(word, []);
      }
      keywords.get(word)!.push(task.id || '');
    }
  }
  
  // Add keyword-based projects if they have 2+ tasks
  for (const [keyword, taskIds] of keywords.entries()) {
    if (taskIds.length >= 2 && !projectMap.has(keyword)) {
      projectMap.set(keyword, [...new Set(taskIds)]);
    }
  }
  
  return Array.from(projectMap.entries()).map(([name, task_ids]) => ({
    name,
    task_ids,
  }));
}

export function contextMapper(extractedTasks: Task[], ideaAnalysis: IdeaAnalysis): ContextMap {
  const tasks = extractedTasks || [];
  const analysis = ideaAnalysis || { topics: [], emotional_tone: 'neutral' };
  
  // Infer projects
  const projects = inferProjects(tasks, analysis.topics || []);
  
  // Categorize tasks
  const categoryMap = new Map<string, string[]>();
  for (const task of tasks) {
    const category = task.category || inferCategory(task.title);
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    if (task.id) {
      categoryMap.get(category)!.push(task.id);
    }
  }
  
  const categories = Array.from(categoryMap.entries()).map(([category, task_ids]) => ({
    category,
    task_ids,
  }));
  
  // Extract people mentions
  const allText = tasks.map(t => t.title).join(' ') + ' ' + (ideaAnalysis?.summary || '');
  const people_mentions = extractPeopleMentions(allText);
  
  // Detect implied deadlines
  const implied_deadlines = tasks
    .map(task => {
      const deadline = inferDeadline(task.title);
      return deadline && task.id ? { task_id: task.id, deadline } : null;
    })
    .filter(Boolean) as Array<{ task_id: string; deadline: string }>;
  
  // Determine time sensitivity
  const time_sensitivity = tasks
    .filter(task => task.id)
    .map(task => ({
      task_id: task.id!,
      urgency: detectUrgency(task.title, analysis.emotional_tone || 'neutral'),
    }));
  
  return {
    projects,
    categories,
    people_mentions,
    implied_deadlines,
    time_sensitivity,
  };
}
