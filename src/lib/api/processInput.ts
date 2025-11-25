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
}

export interface ProcessInputResult {
  tasks: ProcessedTask[];
  ideas: string[];
  decisions: string[];
  contextSummary: Record<string, any>;
  emotion: 'stressed' | 'ok' | 'motivated' | string;
  clarifyingQuestions: string[];
  routing: {
    today: ProcessedTask[];
    upcoming: ProcessedTask[];
    someday: ProcessedTask[];
    projects: ProcessedTask[];
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
