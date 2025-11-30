import { supabase } from '@/integrations/supabase/client';
import { persona } from './persona';
import { retry } from '@/lib/gracefulFallback';

interface LongReasoningResult {
  answer: string;
  reasoning: string;
  steps: string[];
}

/**
 * Run long-form reasoning using OpenAI
 * 
 * @param input - The question or problem to reason about
 * @param context - Additional context for the reasoning process
 * @returns Promise with answer, steps, and hidden reasoning
 */
export async function runLongReasoning(
  input: string,
  context: Record<string, any> = {}
): Promise<LongReasoningResult> {
  // Use retry with exponential backoff for network resilience
  return retry(async () => {
    const { data, error } = await supabase.functions.invoke('long-reasoning', {
      body: {
        input,
        context: {
          ...context,
          persona,
        },
      },
    });

    if (error) {
      console.error('Error calling long-reasoning function:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from long-reasoning function');
    }

    // Return only the answer and steps, hide the chain of thought
    return {
      answer: data.final_answer || '',
      reasoning: 'hidden', // Chain of thought is never exposed
      steps: data.steps || [],
    };
  }, 3, 2000); // 3 retries, starting with 2 second delay
}
