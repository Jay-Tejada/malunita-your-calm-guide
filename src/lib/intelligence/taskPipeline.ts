import { contextMapper } from '@/lib/contextMapper';
import { priorityScorer } from '@/lib/priorityScorer';
import { agendaRouter } from '@/lib/agendaRouter';
import { classifyTask } from '@/lib/tinyTaskDetector';
import { supabase } from '@/integrations/supabase/client';
import type { Task } from '@/hooks/useTasks';

interface TaskIntelligence {
  original: string;
  context: any;
  priority: any;
  routing: any;
  cluster: string | null;
  isTiny: boolean;
}

/**
 * Full intelligence pipeline for a single task
 * Runs all analysis steps and returns unified intelligence object
 */
export async function runTaskPipeline(
  extractedTaskText: string
): Promise<TaskIntelligence> {
  // Create a minimal task object
  const task: Partial<Task> = {
    id: crypto.randomUUID(),
    title: extractedTaskText,
    context: null,
    keywords: [],
    category: null,
  };

  // Create minimal idea analysis (empty state)
  const ideaAnalysis = {
    summary: '',
    insights: [],
    decisions: [],
    ideas: [],
    followups: [],
    questions: [],
    emotional_tone: 'neutral' as const,
    emotionalTone: 'neutral',
    topics: [],
    hasDecision: false,
    hasFollowup: false,
  };

  // Step 1: Run context mapper
  const mappedContext = contextMapper([task as any], ideaAnalysis);

  // Step 2: Run priority scorer
  const priorityScores = priorityScorer([task as any], ideaAnalysis, mappedContext);
  const priorityScore = priorityScores[0] || {
    taskId: task.id,
    score: 0,
    priority: 'COULD',
    effort: 'medium',
  };

  // Step 3: Run agenda router
  const routing = agendaRouter([task as any], mappedContext, priorityScores);

  // Step 4: Call cluster-tasks to get semantic cluster label
  let clusterLabel: string | null = null;
  try {
    const { data: clusterData } = await supabase.functions.invoke('cluster-tasks', {
      body: {
        tasks: [{ id: task.id, title: extractedTaskText }],
        primaryFocusTask: null,
      },
    });
    
    if (clusterData?.clusters?.[0]) {
      clusterLabel = clusterData.clusters[0].label;
    }
  } catch (error) {
    console.error('Error clustering task:', error);
    // Continue without cluster label
  }

  // Step 5: Check if it's a tiny task
  const tinyClassification = classifyTask(task as any);
  const isTiny = tinyClassification.isTiny || extractedTaskText.split(/\s+/).length <= 4;

  // Return unified intelligence object
  return {
    original: extractedTaskText,
    context: mappedContext,
    priority: priorityScore,
    routing,
    cluster: clusterLabel,
    isTiny,
  };
}
