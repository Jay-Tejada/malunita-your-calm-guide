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
