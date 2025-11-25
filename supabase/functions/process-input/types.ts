export interface Task {
  raw: string;
  cleaned: string;
  isTiny: boolean;
  priority: string;
  subtasks: string[];
  due: string | null;
  reminder_time: string | null;
  category: string | null;
  project: string | null;
  people: string[];
  contextMarkers: string[];
  // Virtual flags (computed, not stored)
  task_type?: 'admin' | 'communication' | 'errand' | 'focus' | 'physical' | 'creative' | 'delivery' | 'follow_up';
  tiny_task?: boolean;
  heavy_task?: boolean;
  emotional_weight?: number;
}

export interface UserContext {
  goal: string | null;
  preferences: any;
  prefixes: string[];
  customCategories: string[];
}

export interface ExtractedContent {
  tasks: Array<{ raw: string; cleaned: string }>;
  ideas: string[];
  decisions: string[];
  emotion: 'stressed' | 'ok' | 'motivated';
  clarifyingQuestions: string[];
}

export interface Routing {
  today: string[];
  upcoming: string[];
  someday: string[];
  projects: string[];
}

export interface ProcessInputResult {
  tasks: Task[];
  ideas: string[];
  decisions: string[];
  contextSummary: Record<string, any>;
  emotion: 'stressed' | 'ok' | 'motivated' | string;
  clarifyingQuestions: string[];
  aiResponse?: string;
  routing: Routing;
}
