import { supabase } from '@/integrations/supabase/client';
import { loadClusterAnalysis } from './knowledgeClusters';
import { getFocusPersona } from '@/ai/focusPersonaModel';

export interface FocusPrediction {
  task_id: string;
  task_title: string;
  score: number;
  confidence: number;
  reasoning: string[];
}

interface CandidateTask {
  id: string;
  title: string;
  category?: string;
  cluster_label?: string;
  is_time_based: boolean;
  reminder_time?: string;
  created_at: string;
  keywords?: string[];
  context?: string;
}

interface ScoringFactors {
  priorityScore: number;
  habitScore: number;
  clusterScore: number;
  preferenceScore: number;
  seasonalBoost: number;
  cognitiveLoadScore: number;
  reasoning: string[];
}

// Cache predictions for the day
let cachedPredictions: FocusPrediction[] | null = null;
let cacheDate: string | null = null;

/**
 * Generate candidate tasks for ONE thing prediction
 */
async function generateCandidates(userId: string): Promise<CandidateTask[]> {
  const today = new Date().toISOString().split('T')[0];
  const candidates: CandidateTask[] = [];

  // Fetch open tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!tasks) return [];

  // 1. Overdue tasks (tasks with past reminder times)
  const overdueTasks = tasks.filter(t => {
    if (!t.reminder_time) return false;
    const reminderDate = new Date(t.reminder_time);
    return reminderDate < new Date();
  });

  // 2. Tasks due today
  const todayTasks = tasks.filter(t => {
    if (!t.reminder_time) return false;
    const reminderDate = new Date(t.reminder_time).toISOString().split('T')[0];
    return reminderDate === today;
  });

  // 3. High-priority tasks (marked as time-based or with "urgent" category)
  const highPriorityTasks = tasks.filter(t => 
    t.is_time_based || 
    t.category === 'urgent' || 
    t.category === 'primary_focus'
  );

  // 4. Tasks matching recurring patterns (fetch from habit logs)
  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('task_title, task_category')
    .eq('user_id', userId)
    .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('completed_at', { ascending: false })
    .limit(20);

  const habitualTaskTitles = new Set(habitLogs?.map(log => log.task_title) || []);
  const recurringTasks = tasks.filter(t => habitualTaskTitles.has(t.title));

  // 5. Tasks that cluster with previous ONE things
  const { data: previousFocusTasks } = await supabase
    .from('daily_focus_history')
    .select('focus_task, cluster_label')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(10);

  const clusterLabels = new Set(
    previousFocusTasks?.map(f => f.cluster_label).filter(Boolean) || []
  );

  // 6. Query focus memory embeddings for semantically similar tasks
  let similarFromMemory: CandidateTask[] = [];
  if (previousFocusTasks && previousFocusTasks.length > 0) {
    const recentFocusText = previousFocusTasks[0].focus_task;
    try {
      const { data: memoryData } = await supabase.functions.invoke('focus-memory-query', {
        body: {
          queryText: recentFocusText,
          limit: 5,
          includePatterns: false
        }
      });
      
      if (memoryData?.similarTasks) {
        const similarTaskTexts = new Set(memoryData.similarTasks.map((t: any) => t.taskText as string));
        similarFromMemory = tasks.filter(t => 
          Array.from(similarTaskTexts).some((text: string) => 
            t.title.toLowerCase().includes(text.toLowerCase()) ||
            text.toLowerCase().includes(t.title.toLowerCase())
          )
        );
      }
    } catch (error) {
      console.log('Focus memory query skipped:', error);
    }
  }

  const clusteredTasks = tasks.filter(t => {
    if (!t.keywords || t.keywords.length === 0) return false;
    // Simple cluster matching based on keyword overlap
    return Array.from(clusterLabels).some(label => 
      t.keywords?.some(keyword => 
        keyword.toLowerCase().includes(label?.toLowerCase() || '')
      )
    );
  });

  // Combine all candidates (remove duplicates)
  const allCandidates = [
    ...overdueTasks,
    ...todayTasks,
    ...highPriorityTasks,
    ...recurringTasks,
    ...clusteredTasks,
    ...similarFromMemory,
  ];

  const uniqueCandidates = Array.from(
    new Map(allCandidates.map(task => [task.id, task])).values()
  );

  // Limit to 3-7 tasks (pick top by basic priority)
  const limitedCandidates = uniqueCandidates
    .sort((a, b) => {
      // Prioritize overdue > today > high priority > recurring > clustered
      const scoreA = 
        (overdueTasks.some(t => t.id === a.id) ? 100 : 0) +
        (todayTasks.some(t => t.id === a.id) ? 50 : 0) +
        (highPriorityTasks.some(t => t.id === a.id) ? 25 : 0) +
        (recurringTasks.some(t => t.id === a.id) ? 10 : 0) +
        (clusteredTasks.some(t => t.id === a.id) ? 5 : 0);
      
      const scoreB = 
        (overdueTasks.some(t => t.id === b.id) ? 100 : 0) +
        (todayTasks.some(t => t.id === b.id) ? 50 : 0) +
        (highPriorityTasks.some(t => t.id === b.id) ? 25 : 0) +
        (recurringTasks.some(t => t.id === b.id) ? 10 : 0) +
        (clusteredTasks.some(t => t.id === b.id) ? 5 : 0);
      
      return scoreB - scoreA;
    })
    .slice(0, 7);

  return limitedCandidates;
}

/**
 * Score a candidate task using multiple factors
 */
async function scoreCandidate(
  task: CandidateTask,
  userId: string,
  focusPreferences: Record<string, number>
): Promise<ScoringFactors> {
  const reasoning: string[] = [];
  
  // 1. Priority score based on task properties (0-40 points)
  let priorityScore = 0;
  
  // Time-based tasks get higher priority
  if (task.is_time_based) {
    priorityScore += 15;
    reasoning.push('Time-sensitive task');
  }
  
  // Reminder time today or overdue
  if (task.reminder_time) {
    const reminderDate = new Date(task.reminder_time);
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    const reminderDay = new Date(task.reminder_time).toISOString().split('T')[0];
    
    if (reminderDate < now) {
      priorityScore += 25;
      reasoning.push('Overdue task');
    } else if (reminderDay === today) {
      priorityScore += 20;
      reasoning.push('Due today');
    }
  }
  
  // Category-based priority
  if (task.category === 'urgent' || task.category === 'primary_focus') {
    priorityScore += 15;
    reasoning.push('High priority category');
  }
  
  priorityScore = Math.min(priorityScore, 40);

  // 2. Habitual patterns (0-25 points)
  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('task_title, task_category')
    .eq('user_id', userId)
    .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(50);
  
  const habitScore = habitLogs?.some(log => 
    log.task_title === task.title || log.task_category === task.category
  ) ? 25 : 0;
  
  if (habitScore > 0) {
    reasoning.push('Matches your habitual patterns');
  }

  // 3. Cluster match (0-20 points)
  const clusterAnalysis = loadClusterAnalysis();
  let clusterScore = 0;
  
  if (clusterAnalysis) {
    // Check if task belongs to a cluster
    const belongsToCluster = clusterAnalysis.clusters.some(cluster =>
      cluster.tasks.includes(task.id)
    );
    
    if (belongsToCluster) {
      clusterScore = 20;
      reasoning.push('Part of an active task cluster');
    }
  }

  // 4. User focus preferences (0-15 points)
  const preferenceScore = task.category && focusPreferences[task.category] 
    ? Math.min(focusPreferences[task.category] * 15, 15)
    : 0;
  
  if (preferenceScore > 10) {
    reasoning.push('Aligns with your focus preferences');
  }

  // 5. Seasonal pattern boost (0-10 points)
  let seasonalBoost = 0;
  const seasonalWeight = (focusPreferences as any).seasonal_weight as Record<string, any> | undefined;
  if (seasonalWeight) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    const category = task.cluster_label || task.category || '';

    // Check Monday reset pattern
    if (dayOfWeek === 1 && seasonalWeight.monday_reset?.category === category) {
      seasonalBoost += seasonalWeight.monday_reset.weight * 100; // Scale to 10 points
      reasoning.push('Monday pattern match');
    }

    // Check weekend pattern
    if ((dayOfWeek === 0 || dayOfWeek === 6) && seasonalWeight.weekend_family?.category === category) {
      seasonalBoost += seasonalWeight.weekend_family.weight * 100;
      reasoning.push('Weekend pattern match');
    }

    // Check month-start pattern
    if (dayOfMonth >= 1 && dayOfMonth <= 7 && seasonalWeight.month_start_admin?.category === category) {
      seasonalBoost += seasonalWeight.month_start_admin.weight * 100;
      reasoning.push('Month-start pattern');
    }

    // Check month-end pattern
    if (dayOfMonth >= 24 && seasonalWeight.month_end_financial?.category === category) {
      seasonalBoost += seasonalWeight.month_end_financial.weight * 100;
      reasoning.push('Month-end pattern');
    }
  }

  // 6. Cognitive load estimate (0-10 points, higher for simpler tasks)
  const wordCount = task.title.split(/\s+/).length;
  const isComplex = wordCount > 8;
  const cognitiveLoadScore = isComplex ? 5 : 10;
  
  if (!isComplex) {
    reasoning.push('Manageable cognitive load');
  }

  return {
    priorityScore,
    habitScore,
    clusterScore,
    preferenceScore,
    seasonalBoost,
    cognitiveLoadScore,
    reasoning,
  };
}

/**
 * Generate primary focus predictions for the day
 */
export async function generatePrimaryFocusPredictions(): Promise<FocusPrediction[]> {
  const today = new Date().toISOString().split('T')[0];
  
  // Return cached predictions if available for today
  if (cachedPredictions && cacheDate === today) {
    console.log('Returning cached primary focus predictions');
    return cachedPredictions;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found for primary focus prediction');
      return [];
    }

    // Fetch user's focus preferences and persona
    const { data: profile } = await supabase
      .from('profiles')
      .select('focus_preferences, focus_persona')
      .eq('id', user.id)
      .single();

    const focusPreferences: Record<string, number> = 
      typeof profile?.focus_preferences === 'object' && profile?.focus_preferences !== null
        ? (profile.focus_preferences as Record<string, number>)
        : {};

    const focusPersona = profile?.focus_persona ? profile.focus_persona as any : null;

    // Generate candidate tasks
    const candidates = await generateCandidates(user.id);
    
    if (candidates.length === 0) {
      console.log('No candidate tasks for primary focus prediction');
      return [];
    }

    console.log(`Scoring ${candidates.length} candidate tasks for primary focus`);

    // Score each candidate
    const scoredCandidates = await Promise.all(
      candidates.map(async (task) => {
        const factors = await scoreCandidate(task, user.id, focusPreferences);
        
        // Calculate total score (0-110 points)
        let totalScore = 
          factors.priorityScore +
          factors.habitScore +
          factors.clusterScore +
          factors.preferenceScore +
          factors.seasonalBoost +
          factors.cognitiveLoadScore;

        // Apply persona-based adjustments
        if (focusPersona) {
          // Preference domain boost
          if (task.category && focusPersona.preference_domains?.[task.category]) {
            totalScore += focusPersona.preference_domains[task.category] * 20;
            factors.reasoning.push('Matches persona preference');
          }

          // Avoidance penalty
          if (task.category && focusPersona.avoidance_profile?.[task.category]) {
            totalScore -= focusPersona.avoidance_profile[task.category] * 15;
            factors.reasoning.push('Persona avoidance pattern detected');
          }

          // Ambition-based complexity matching
          const taskComplexity = (task.title?.length || 0) / 200;
          const ambitionMatch = 1 - Math.abs((focusPersona.ambition || 0.5) - taskComplexity);
          totalScore += ambitionMatch * 10;
          if (ambitionMatch > 0.7) {
            factors.reasoning.push('Matches persona ambition level');
          }
        }

        // Normalize to 0-100 and calculate confidence
        const normalizedScore = Math.min((totalScore / 110) * 100, 100);
        const confidence = normalizedScore / 100;

        return {
          task_id: task.id,
          task_title: task.title,
          score: normalizedScore,
          confidence,
          reasoning: factors.reasoning,
        };
      })
    );

    // Sort by score (highest first)
    const predictions = scoredCandidates
      .sort((a, b) => b.score - a.score)
      .filter(p => p.score > 20); // Only include predictions with score > 20

    console.log('Primary focus predictions generated:', predictions.length);
    
    // Cache predictions for the day
    cachedPredictions = predictions;
    cacheDate = today;

    return predictions;
  } catch (error) {
    console.error('Error generating primary focus predictions:', error);
    return [];
  }
}

/**
 * Get the top prediction (highest scoring)
 */
export async function getTopPrimaryFocusPrediction(): Promise<FocusPrediction | null> {
  const predictions = await generatePrimaryFocusPredictions();
  return predictions.length > 0 ? predictions[0] : null;
}

/**
 * Get all predictions for the day
 */
export async function getPrimaryFocusPredictions(): Promise<FocusPrediction[]> {
  return generatePrimaryFocusPredictions();
}

/**
 * Clear cached predictions (useful for testing or when user manually overrides)
 */
export function clearPrimaryFocusPredictionCache(): void {
  cachedPredictions = null;
  cacheDate = null;
  console.log('Primary focus prediction cache cleared');
}
