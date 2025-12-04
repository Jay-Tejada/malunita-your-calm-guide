import { supabase } from "@/integrations/supabase/client";
import { contextMapper } from "./contextMapper";
import { priorityScorer } from "./priorityScorer";
import { agendaRouter } from "./agendaRouter";

interface ExtractedTask {
  title: string;
  suggested_category?: string;
  custom_category_id?: string;
  suggested_timeframe?: string;
  confidence?: number;
  confirmation_prompt?: string;
  reminder_time?: string | null;
  goal_aligned?: boolean;
  alignment_reason?: string;
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

interface EnrichedTask {
  title: string;
  category?: string;
  custom_category_id?: string;
  priority: 'MUST' | 'SHOULD' | 'COULD';
  effort: 'tiny' | 'small' | 'medium' | 'large';
  context: string;
  scheduled_bucket: 'today' | 'tomorrow' | 'this_week' | 'upcoming' | 'someday';
  is_tiny: boolean;
  reminder_time?: string | null;
  goal_aligned?: boolean;
  alignment_reason?: string;
  idea_metadata: {
    original_input: string;
    emotional_tone: string;
    topics: string[];
    insights: string[];
  };
}

interface ProcessingResult {
  tasks: EnrichedTask[];
  ambiguous: boolean;
  reason?: string;
}

/**
 * Main task intelligence pipeline
 * Takes raw user input and returns enriched task objects with full intelligence
 * @param text - The raw input text
 * @param clarificationData - Optional clarification answers from previous interaction
 */
export async function processRawInput(
  text: string, 
  clarificationData?: any
): Promise<ProcessingResult> {
  try {
    // Step 1: Extract tasks from natural language
    const { data: extractionData, error: extractionError } = await supabase.functions.invoke<{
      tasks: ExtractedTask[];
    }>('extract-tasks', {
      body: { text }
    });

    if (extractionError || !extractionData?.tasks) {
      console.error('Task extraction failed:', extractionError);
      return {
        tasks: [],
        ambiguous: false,
      };
    }

    // DEPRECATED: idea-analyzer deleted in Phase 3C
    // TODO: Replace with process-input or suggest-focus for context analysis
    // Using local fallback for idea analysis
    console.log('idea-analyzer removed - using local fallback');

    const ideaAnalysis: IdeaAnalysis = {
      summary: text,
      topics: [],
      insights: [],
      decisions: [],
      ideas: [],
      followups: [],
      questions: [],
      emotional_tone: 'neutral',
    };

    // Assign temporary IDs for processing
    const tasksWithIds = extractionData.tasks.map((task, index) => ({
      ...task,
      id: `temp-${Date.now()}-${index}`,
    }));

    // Step 3: Map context
    const contextMap = contextMapper(tasksWithIds, ideaAnalysis);

    // Step 4: Score priorities
    const priorityScores = priorityScorer(tasksWithIds, ideaAnalysis, contextMap);

    // Step 5: Route to agenda buckets
    const routing = agendaRouter(tasksWithIds, contextMap, priorityScores);

    // Step 6: Process each task with full intelligence
    const enrichedTasks: EnrichedTask[] = [];

    for (const task of extractionData.tasks) {
      const tempId = tasksWithIds.find(t => t.title === task.title)?.id;
      if (!tempId) continue;

      const score = priorityScores.find(s => s.task_id === tempId);
      if (!score) continue;

      // Determine scheduled bucket
      let scheduled_bucket: 'today' | 'tomorrow' | 'this_week' | 'upcoming' | 'someday' = 'upcoming';
      if (routing.today.includes(tempId)) scheduled_bucket = 'today';
      else if (routing.tomorrow.includes(tempId)) scheduled_bucket = 'tomorrow';
      else if (routing.this_week.includes(tempId)) scheduled_bucket = 'this_week';
      else if (routing.upcoming.includes(tempId)) scheduled_bucket = 'upcoming';
      else if (routing.someday.includes(tempId)) scheduled_bucket = 'someday';

      // Step 7: Get AI category
      let aiCategory = task.suggested_category || 'personal';
      try {
        const { data: categoryData } = await supabase.functions.invoke<{
          category: string;
          custom_category_id?: string;
        }>('categorize-task', {
          body: { 
            task_text: task.title,
            context: ideaAnalysis.summary 
          }
        });
        
        if (categoryData?.category) {
          aiCategory = categoryData.category;
        }
      } catch (err) {
        console.error('Categorization failed:', err);
      }

      // Step 8: Classify tiny task
      let isTiny = score.effort === 'tiny';
      try {
        const { data: tinyData } = await supabase.functions.invoke<{
          is_tiny: boolean;
          reasoning?: string;
        }>('classify-tiny-task', {
          body: { task_text: task.title }
        });
        
        if (tinyData?.is_tiny !== undefined) {
          isTiny = tinyData.is_tiny;
        }
      } catch (err) {
        console.error('Tiny task classification failed:', err);
      }

      // Build context string
      const contextParts = [];
      if (contextMap.people_mentions.length > 0) {
        contextParts.push(`People: ${contextMap.people_mentions.join(', ')}`);
      }
      if (ideaAnalysis.topics.length > 0) {
        contextParts.push(`Topics: ${ideaAnalysis.topics.join(', ')}`);
      }
      if (ideaAnalysis.emotional_tone !== 'neutral') {
        contextParts.push(`Mood: ${ideaAnalysis.emotional_tone}`);
      }

      enrichedTasks.push({
        title: task.title,
        category: aiCategory,
        custom_category_id: task.custom_category_id,
        priority: score.priority,
        effort: score.effort,
        context: contextParts.join(' | '),
        scheduled_bucket,
        is_tiny: isTiny,
        reminder_time: task.reminder_time,
        goal_aligned: task.goal_aligned,
        alignment_reason: task.alignment_reason,
        idea_metadata: {
          original_input: text,
          emotional_tone: ideaAnalysis.emotional_tone,
          topics: ideaAnalysis.topics,
          insights: ideaAnalysis.insights,
        },
      });
    }

    // Check for ambiguity
    const isAmbiguous = enrichedTasks.length === 1 && (
      !enrichedTasks[0].category || 
      enrichedTasks[0].priority === 'COULD' ||
      enrichedTasks[0].context.length < 10
    );

    let ambiguityReason: string | undefined;
    if (isAmbiguous) {
      if (!enrichedTasks[0].category) {
        ambiguityReason = "Could you specify what type of task this is?";
      } else if (enrichedTasks[0].priority === 'COULD') {
        ambiguityReason = "How urgent is this task?";
      } else {
        ambiguityReason = "Could you provide more details?";
      }
    }

    return {
      tasks: enrichedTasks,
      ambiguous: isAmbiguous,
      reason: ambiguityReason,
    };
  } catch (error) {
    console.error('Task processing pipeline failed:', error);
    return {
      tasks: [],
      ambiguous: false,
    };
  }
}
