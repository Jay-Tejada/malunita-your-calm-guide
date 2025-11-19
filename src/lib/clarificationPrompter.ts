interface Task {
  id?: string;
  title: string;
  category?: string;
  custom_category_id?: string;
  reminder_time?: string | null;
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

interface ClarificationQuestion {
  task_id: string;
  question: string;
  type: 'deadline' | 'category' | 'project' | 'priority' | 'agenda';
}

interface ClarificationOutput {
  questions: ClarificationQuestion[];
  needs_clarification: boolean;
  total_questions: number;
}

const MAX_QUESTIONS = 3; // Limit to avoid overwhelming users

function generateDeadlineQuestion(task: Task): string {
  const questions = [
    `When would you like "${task.title}" done? Today, tomorrow, or this week?`,
    `Do you have a deadline in mind for "${task.title}"?`,
    `Should "${task.title}" be done today or can it wait?`,
  ];
  return questions[Math.floor(Math.random() * questions.length)];
}

function generateCategoryQuestion(task: Task): string {
  const questions = [
    `Should "${task.title}" belong to Work or Personal?`,
    `What area does "${task.title}" fit into? Work, home, or personal?`,
    `Is "${task.title}" work-related or personal?`,
  ];
  return questions[Math.floor(Math.random() * questions.length)];
}

function generateProjectQuestion(task: Task, projectName: string): string {
  const questions = [
    `Is "${task.title}" part of your ${projectName} project?`,
    `Should I group "${task.title}" with ${projectName}?`,
    `Does "${task.title}" relate to ${projectName}?`,
  ];
  return questions[Math.floor(Math.random() * questions.length)];
}

function generatePriorityQuestion(task: Task): string {
  const questions = [
    `How urgent is "${task.title}"? Must do, should do, or nice to have?`,
    `Is "${task.title}" a high priority or can it wait?`,
    `Should I mark "${task.title}" as urgent?`,
  ];
  return questions[Math.floor(Math.random() * questions.length)];
}

function generateAgendaQuestion(task: Task): string {
  const questions = [
    `Should I add "${task.title}" to your agenda?`,
    `Do you want "${task.title}" scheduled for today?`,
    `Would you like to track "${task.title}" in your tasks?`,
  ];
  return questions[Math.floor(Math.random() * questions.length)];
}

export function clarificationPrompter(
  extractedTasks: Task[],
  contextMap: ContextMap,
  priorityScores: TaskScore[],
  ideaAnalysis: IdeaAnalysis
): ClarificationOutput {
  const questions: ClarificationQuestion[] = [];
  const tasks = extractedTasks || [];
  const context = contextMap || { implied_deadlines: [], projects: [], categories: [] };
  const scores = priorityScores || [];
  
  // Create lookup maps
  const deadlineMap = new Map<string, string>();
  context.implied_deadlines.forEach(d => deadlineMap.set(d.task_id, d.deadline));
  
  const scoreMap = new Map<string, TaskScore>();
  scores.forEach(s => scoreMap.set(s.task_id, s));
  
  // 1. Check for tasks missing deadlines (high priority)
  for (const task of tasks) {
    if (!task.id || questions.length >= MAX_QUESTIONS) break;
    
    const hasDeadline = deadlineMap.has(task.id) || task.reminder_time;
    const score = scoreMap.get(task.id);
    
    // Ask about deadline if MUST or SHOULD priority but no deadline
    if (!hasDeadline && score && (score.priority === 'MUST' || score.priority === 'SHOULD')) {
      questions.push({
        task_id: task.id,
        question: generateDeadlineQuestion(task),
        type: 'deadline',
      });
    }
  }
  
  // 2. Check for tasks missing categories
  for (const task of tasks) {
    if (!task.id || questions.length >= MAX_QUESTIONS) break;
    
    const hasCategory = task.category || task.custom_category_id;
    
    if (!hasCategory) {
      questions.push({
        task_id: task.id,
        question: generateCategoryQuestion(task),
        type: 'category',
      });
    }
  }
  
  // 3. Check for unclear project associations
  if (context.projects.length > 0 && questions.length < MAX_QUESTIONS) {
    for (const project of context.projects) {
      if (questions.length >= MAX_QUESTIONS) break;
      
      // Find tasks that might belong to this project but aren't assigned
      for (const task of tasks) {
        if (!task.id || questions.length >= MAX_QUESTIONS) break;
        
        const isInProject = project.task_ids.includes(task.id);
        const titleLower = task.title.toLowerCase();
        const projectLower = project.name.toLowerCase();
        
        // If task title mentions project but not assigned, ask
        if (!isInProject && (titleLower.includes(projectLower) || projectLower.includes(titleLower))) {
          questions.push({
            task_id: task.id,
            question: generateProjectQuestion(task, project.name),
            type: 'project',
          });
        }
      }
    }
  }
  
  // 4. Check for ambiguous priorities (COULD tasks that might need upgrading)
  for (const task of tasks) {
    if (!task.id || questions.length >= MAX_QUESTIONS) break;
    
    const score = scoreMap.get(task.id);
    
    // If task is marked COULD but has urgency keywords, clarify priority
    if (score && score.priority === 'COULD') {
      const titleLower = task.title.toLowerCase();
      const urgentKeywords = ['important', 'need', 'should', 'must'];
      
      if (urgentKeywords.some(keyword => titleLower.includes(keyword))) {
        questions.push({
          task_id: task.id,
          question: generatePriorityQuestion(task),
          type: 'priority',
        });
      }
    }
  }
  
  // 5. Ask about agenda placement if user seems uncertain
  if (ideaAnalysis.emotional_tone === 'overwhelmed' && questions.length < MAX_QUESTIONS) {
    for (const task of tasks) {
      if (!task.id || questions.length >= MAX_QUESTIONS) break;
      
      const score = scoreMap.get(task.id);
      
      // Offer to schedule SHOULD tasks to reduce overwhelm
      if (score && score.priority === 'SHOULD' && !task.reminder_time) {
        questions.push({
          task_id: task.id,
          question: generateAgendaQuestion(task),
          type: 'agenda',
        });
        break; // Only ask once when overwhelmed
      }
    }
  }
  
  return {
    questions: questions.slice(0, MAX_QUESTIONS),
    needs_clarification: questions.length > 0,
    total_questions: questions.length,
  };
}
