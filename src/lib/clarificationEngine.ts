import { supabase } from "@/integrations/supabase/client";

interface ClarificationRequest {
  originalText: string;
  task: any;
  reason: string;
}

interface ClarificationResponse {
  question: string;
  options?: string[];
  expectedField: 'date' | 'urgency' | 'category' | 'priority' | 'plan';
}

export async function getClarification(request: ClarificationRequest): Promise<ClarificationResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('idea-analyzer', {
      body: {
        text: request.originalText,
        mode: 'clarify',
        taskData: request.task,
        ambiguityReason: request.reason,
      }
    });

    if (error) throw error;

    // Return clarification from AI
    if (data?.clarification) {
      return data.clarification;
    }

    // Fallback clarification based on reason
    return generateFallbackClarification(request.reason);
  } catch (error) {
    console.error('Clarification engine error:', error);
    return generateFallbackClarification(request.reason);
  }
}

function generateFallbackClarification(reason: string): ClarificationResponse {
  const reasonLower = reason.toLowerCase();

  if (reasonLower.includes('deadline') || reasonLower.includes('when') || reasonLower.includes('date')) {
    return {
      question: "When do you need this done?",
      options: [
        "Today",
        "Tomorrow",
        "This week",
        "Next week",
        "No deadline"
      ],
      expectedField: 'date',
    };
  }

  if (reasonLower.includes('urgent') || reasonLower.includes('priority')) {
    return {
      question: "How urgent is this task?",
      options: [
        "Very urgent - must do today",
        "Important - should do soon",
        "Normal priority",
        "Low priority"
      ],
      expectedField: 'urgency',
    };
  }

  if (reasonLower.includes('category') || reasonLower.includes('type')) {
    return {
      question: "What type of task is this?",
      options: [
        "Work",
        "Personal",
        "Health",
        "Shopping",
        "Learning"
      ],
      expectedField: 'category',
    };
  }

  if (reasonLower.includes('plan') || reasonLower.includes('how') || reasonLower.includes('steps')) {
    return {
      question: "Do you have a plan for how to do this?",
      expectedField: 'plan',
    };
  }

  // Default fallback
  return {
    question: "Can you provide more details about this task?",
    expectedField: 'plan',
  };
}
