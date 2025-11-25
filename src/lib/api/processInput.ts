import { supabase } from "@/integrations/supabase/client";

export interface ProcessInputPayload {
  text: string;
  userId: string;
}

export interface ProcessedTask {
  raw: string;
  cleaned: string;
  priority: 'must' | 'should' | 'could';
  isTiny: boolean;
  category?: string | null;
  due?: string | null;
  reminder_time?: string | null;
  project?: string | null;
  people: string[];
  contextMarkers: string[];
  subtasks: string[];
  // Virtual enrichment fields
  summary?: string;
  task_type?: 'admin' | 'communication' | 'errand' | 'focus' | 'physical' | 'creative' | 'delivery' | 'follow_up';
  tiny_task?: boolean;
  heavy_task?: boolean;
  emotional_weight?: number;
  priority_score?: number;
  ideal_time?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  ideal_day?: 'today' | 'tomorrow' | 'this_week' | 'later';
  is_one_thing?: boolean;
}

export interface ProcessInputResult {
  tasks: ProcessedTask[];
  ideas: string[];
  decisions: string[];
  contextSummary: Record<string, any>;
  emotion: 'stressed' | 'ok' | 'motivated' | string;
  clarifyingQuestions: string[];
  aiResponse?: string;
  routing: {
    today: ProcessedTask[];
    upcoming: ProcessedTask[];
    someday: ProcessedTask[];
    projects: ProcessedTask[];
    work: ProcessedTask[];
    home: ProcessedTask[];
    gym: ProcessedTask[];
    inbox: ProcessedTask[];
  };
}

export async function processInput(payload: ProcessInputPayload): Promise<ProcessInputResult> {
  const { data, error } = await supabase.functions.invoke('process-input', {
    body: {
      text: payload.text,
      user_id: payload.userId,
    },
  });

  if (error) {
    console.error('process-input failed', error);
    throw error;
  }

  return data as ProcessInputResult;
}
