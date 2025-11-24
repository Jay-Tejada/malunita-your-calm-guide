import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format, getHours } from "date-fns";

export interface FocusPersona {
  ambition: number; // 0-1, how complex tasks they choose
  preference_domains: Record<string, number>; // cluster -> weight
  time_of_day_tendency: string; // "morning" | "afternoon" | "evening" | "night"
  emotional_alignment: Record<string, string[]>; // mood -> preferred clusters
  momentum: number; // 0-1, how well they maintain streaks
  avoidance_profile: Record<string, number>; // cluster -> avoidance score
  last_updated: string | null;
  analysis_count: number;
}

/**
 * Analyze the last 30 ONE-thing entries to build a personality profile
 */
export async function analyzeFocusPersona(userId: string): Promise<FocusPersona | null> {
  try {
    // Fetch last 30 focus history entries
    const thirtyDaysAgo = subDays(new Date(), 30);
    const { data: focusHistory } = await supabase
      .from('daily_focus_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(30);

    if (!focusHistory || focusHistory.length === 0) {
      return null;
    }

    // Fetch corresponding embeddings for complexity analysis
    const { data: embeddings } = await supabase
      .from('focus_embeddings')
      .select('task_text, cluster_label, unlocks_count, created_at, outcome')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Fetch memory journal for emotional alignment
    const { data: journal } = await supabase
      .from('memory_journal')
      .select('date, mood, emotional_state')
      .eq('user_id', userId)
      .gte('date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
      .order('date', { ascending: false });

    // 1. Calculate Ambition (based on task complexity)
    const ambition = calculateAmbition(embeddings || []);

    // 2. Build Preference Domains (cluster distribution)
    const preference_domains = buildPreferenceDomains(focusHistory);

    // 3. Determine Time-of-day Tendency
    const time_of_day_tendency = determineTimeOfDayTendency(focusHistory);

    // 4. Build Emotional Alignment (mood -> clusters)
    const emotional_alignment = buildEmotionalAlignment(focusHistory, journal || []);

    // 5. Calculate Momentum (streak consistency)
    const momentum = calculateMomentum(focusHistory);

    // 6. Build Avoidance Profile (skipped/missed tasks)
    const avoidance_profile = buildAvoidanceProfile(focusHistory);

    const persona: FocusPersona = {
      ambition,
      preference_domains,
      time_of_day_tendency,
      emotional_alignment,
      momentum,
      avoidance_profile,
      last_updated: new Date().toISOString(),
      analysis_count: focusHistory.length,
    };

    return persona;
  } catch (error) {
    console.error('Error analyzing focus persona:', error);
    return null;
  }
}

/**
 * Calculate ambition score based on task complexity indicators
 */
function calculateAmbition(embeddings: any[]): number {
  if (embeddings.length === 0) return 0.5;

  // Use unlocks_count and task length as complexity proxies
  let totalComplexity = 0;
  let count = 0;

  embeddings.forEach(emb => {
    const unlocksScore = Math.min((emb.unlocks_count || 0) / 10, 1); // normalize to 0-1
    const lengthScore = Math.min(emb.task_text.length / 200, 1); // normalize to 0-1
    totalComplexity += (unlocksScore + lengthScore) / 2;
    count++;
  });

  return count > 0 ? totalComplexity / count : 0.5;
}

/**
 * Build preference domains from cluster distribution
 */
function buildPreferenceDomains(focusHistory: any[]): Record<string, number> {
  const clusterCounts: Record<string, number> = {};
  const total = focusHistory.length;

  focusHistory.forEach(entry => {
    if (entry.cluster_label) {
      clusterCounts[entry.cluster_label] = (clusterCounts[entry.cluster_label] || 0) + 1;
    }
  });

  // Convert counts to normalized weights
  const domains: Record<string, number> = {};
  Object.entries(clusterCounts).forEach(([cluster, count]) => {
    domains[cluster] = count / total;
  });

  return domains;
}

/**
 * Determine primary time-of-day tendency
 */
function determineTimeOfDayTendency(focusHistory: any[]): string {
  const timeBuckets = {
    morning: 0,   // 6-12
    afternoon: 0, // 12-17
    evening: 0,   // 17-21
    night: 0,     // 21-6
  };

  focusHistory.forEach(entry => {
    const hour = getHours(new Date(entry.created_at));
    if (hour >= 6 && hour < 12) timeBuckets.morning++;
    else if (hour >= 12 && hour < 17) timeBuckets.afternoon++;
    else if (hour >= 17 && hour < 21) timeBuckets.evening++;
    else timeBuckets.night++;
  });

  // Return the time bucket with highest count
  return Object.entries(timeBuckets).reduce((a, b) => 
    b[1] > a[1] ? b : a
  )[0];
}

/**
 * Build emotional alignment mapping moods to preferred clusters
 */
function buildEmotionalAlignment(
  focusHistory: any[],
  journal: any[]
): Record<string, string[]> {
  const alignment: Record<string, Set<string>> = {};

  focusHistory.forEach(entry => {
    const entryDate = format(new Date(entry.created_at), 'yyyy-MM-dd');
    const journalEntry = journal.find(j => j.date === entryDate);
    
    if (journalEntry && entry.cluster_label) {
      const mood = journalEntry.mood;
      if (!alignment[mood]) {
        alignment[mood] = new Set();
      }
      alignment[mood].add(entry.cluster_label);
    }
  });

  // Convert Sets to Arrays
  const result: Record<string, string[]> = {};
  Object.entries(alignment).forEach(([mood, clusters]) => {
    result[mood] = Array.from(clusters);
  });

  return result;
}

/**
 * Calculate momentum score based on streak consistency
 */
function calculateMomentum(focusHistory: any[]): number {
  if (focusHistory.length === 0) return 0.5;

  // Sort by date
  const sorted = [...focusHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let streaks: number[] = [];
  let currentStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].date);
    const currDate = new Date(sorted[i].date);
    const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1 && sorted[i].outcome === 'achieved') {
      currentStreak++;
    } else {
      if (currentStreak > 1) streaks.push(currentStreak);
      currentStreak = 1;
    }
  }
  if (currentStreak > 1) streaks.push(currentStreak);

  // Calculate average streak length, normalize to 0-1
  const avgStreak = streaks.length > 0 
    ? streaks.reduce((a, b) => a + b, 0) / streaks.length 
    : 1;
  
  return Math.min(avgStreak / 7, 1); // 7-day streak = perfect momentum
}

/**
 * Build avoidance profile for clusters that get skipped
 */
function buildAvoidanceProfile(focusHistory: any[]): Record<string, number> {
  const clusterOutcomes: Record<string, { total: number; missed: number }> = {};

  focusHistory.forEach(entry => {
    if (entry.cluster_label) {
      if (!clusterOutcomes[entry.cluster_label]) {
        clusterOutcomes[entry.cluster_label] = { total: 0, missed: 0 };
      }
      clusterOutcomes[entry.cluster_label].total++;
      if (entry.outcome === 'missed' || entry.outcome === 'avoided') {
        clusterOutcomes[entry.cluster_label].missed++;
      }
    }
  });

  // Calculate avoidance rates
  const avoidance: Record<string, number> = {};
  Object.entries(clusterOutcomes).forEach(([cluster, stats]) => {
    avoidance[cluster] = stats.total > 0 ? stats.missed / stats.total : 0;
  });

  return avoidance;
}

/**
 * Store the persona in the user's profile
 */
export async function updateFocusPersona(userId: string): Promise<boolean> {
  try {
    const persona = await analyzeFocusPersona(userId);
    if (!persona) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ focus_persona: persona as any })
      .eq('id', userId);

    if (error) {
      console.error('Error updating focus persona:', error);
      return false;
    }

    console.log('✅ Focus persona updated:', persona);
    return true;
  } catch (error) {
    console.error('Error in updateFocusPersona:', error);
    return false;
  }
}

/**
 * Get the current focus persona for a user
 */
export async function getFocusPersona(userId: string): Promise<FocusPersona | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('focus_persona')
      .eq('id', userId)
      .single();

    if (error || !data?.focus_persona) return null;

    return data.focus_persona as unknown as FocusPersona;
  } catch (error) {
    console.error('Error fetching focus persona:', error);
    return null;
  }
}
