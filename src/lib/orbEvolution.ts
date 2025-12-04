import { supabase } from '@/integrations/supabase/client';

interface EvolutionMetrics {
  totalTasksCompleted: number;
  journalStreak: number;
  focusSessionsCompleted: number;
  daysActive: number;
  tinyFiestasCompleted: number;
}

const STAGE_THRESHOLDS = [
  { stage: 2, tasks: 25, days: 3 },
  { stage: 3, tasks: 75, days: 7 },
  { stage: 4, tasks: 150, days: 14 },
  { stage: 5, tasks: 300, days: 30 },
  { stage: 6, tasks: 500, days: 60 },
  { stage: 7, tasks: 1000, days: 90 },
];

export async function checkEvolution(
  userId: string, 
  currentStage: number,
  metrics: EvolutionMetrics
): Promise<{ shouldEvolve: boolean; newStage: number }> {
  
  const nextThreshold = STAGE_THRESHOLDS.find(t => t.stage === currentStage + 1);
  
  if (!nextThreshold) {
    return { shouldEvolve: false, newStage: currentStage };
  }
  
  const meetsTaskRequirement = metrics.totalTasksCompleted >= nextThreshold.tasks;
  const meetsDaysRequirement = metrics.daysActive >= nextThreshold.days;
  
  if (meetsTaskRequirement && meetsDaysRequirement) {
    return { shouldEvolve: true, newStage: nextThreshold.stage };
  }
  
  return { shouldEvolve: false, newStage: currentStage };
}

export async function fetchEvolutionMetrics(userId: string): Promise<EvolutionMetrics> {
  // Fetch completed tasks count
  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('completed', true);

  // Fetch task history for days active
  const { data: history } = await supabase
    .from('task_history')
    .select('completed_at')
    .eq('user_id', userId);

  const uniqueDays = new Set(
    history?.map(h => new Date(h.completed_at).toDateString()) || []
  );

  // Fetch focus sessions completed
  const { count: focusCount } = await supabase
    .from('flow_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  // Fetch tiny task fiesta sessions
  const { count: fiestaCount } = await supabase
    .from('tiny_task_fiesta_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return {
    totalTasksCompleted: tasksCount || 0,
    journalStreak: 0, // TODO: Calculate from journal_entries
    focusSessionsCompleted: focusCount || 0,
    daysActive: uniqueDays.size,
    tinyFiestasCompleted: fiestaCount || 0,
  };
}

export async function saveEvolution(userId: string, newStage: number) {
  await supabase
    .from('profiles')
    .update({ 
      companion_stage: newStage,
      orb_last_evolution: new Date().toISOString()
    })
    .eq('id', userId);
}

export { STAGE_THRESHOLDS };
