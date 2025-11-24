import { supabase } from '@/integrations/supabase/client';
import { useCognitiveLoad } from '@/state/cognitiveLoad';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { getFocusPersona } from './focusPersonaModel';

export interface BurnoutAnalysis {
  risk: number; // 0-1 scale
  factors: {
    highCognitiveLoad: boolean;
    highFatigue: boolean;
    missedFocus: boolean;
    taskOverload: boolean;
    lowMomentum: boolean;
  };
  inRecoveryMode: boolean;
  recoveryUntil?: Date;
}

/**
 * Analyze burnout risk based on multiple behavioral signals
 */
export async function analyzeBurnoutRisk(userId: string): Promise<BurnoutAnalysis> {
  const factors = {
    highCognitiveLoad: false,
    highFatigue: false,
    missedFocus: false,
    taskOverload: false,
    lowMomentum: false,
  };

  let riskScore = 0;

  // 1. Check cognitive load history (high for 3+ days)
  const cognitiveLoadHistory = await getCognitiveLoadHistory(userId, 3);
  const highLoadDays = cognitiveLoadHistory.filter(entry => entry.level === 'HIGH').length;
  if (highLoadDays >= 3) {
    factors.highCognitiveLoad = true;
    riskScore += 0.25;
  }

  // 2. Check emotional memory fatigue (consistently above 60)
  const emotionalState = useEmotionalMemory.getState();
  if (emotionalState.fatigue > 60) {
    const fatigueHistory = await getFatigueHistory(userId, 5);
    const highFatigueDays = fatigueHistory.filter(entry => 
      (entry.emotional_state as any)?.fatigue > 60
    ).length;
    if (highFatigueDays >= 3) {
      factors.highFatigue = true;
      riskScore += 0.25;
    }
  }

  // 3. Check missed ONE things (2 days in a row)
  const missedDays = await checkMissedFocusDays(userId, 2);
  if (missedDays >= 2) {
    factors.missedFocus = true;
    riskScore += 0.2;
  }

  // 4. Check incomplete task accumulation
  const { data: incompleteTasks } = await supabase
    .from('tasks')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('completed', false)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (incompleteTasks && incompleteTasks.length > 20) {
    factors.taskOverload = true;
    riskScore += 0.15;
  }

  // 5. Check focusPersona momentum trend
  const persona = await getFocusPersona(userId);
  if (persona && persona.momentum < 0.3) {
    factors.lowMomentum = true;
    riskScore += 0.15;
  }

  // Check if already in recovery mode
  const { data: profile } = await supabase
    .from('profiles')
    .select('burnout_recovery_until')
    .eq('id', userId)
    .single();

  const inRecoveryMode = profile?.burnout_recovery_until 
    ? new Date(profile.burnout_recovery_until) > new Date()
    : false;

  const recoveryUntil = profile?.burnout_recovery_until 
    ? new Date(profile.burnout_recovery_until)
    : undefined;

  return {
    risk: Math.min(riskScore, 1),
    factors,
    inRecoveryMode,
    recoveryUntil,
  };
}

/**
 * Update burnout status in profile
 */
export async function updateBurnoutStatus(userId: string): Promise<boolean> {
  try {
    const analysis = await analyzeBurnoutRisk(userId);
    const now = new Date();
    
    // If risk is high and not already in recovery, trigger recovery mode
    let recoveryUntil = null;
    let detectedAt = null;

    if (analysis.risk >= 0.6 && !analysis.inRecoveryMode) {
      // Start 48-hour recovery period
      recoveryUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      detectedAt = now;
      
      console.log('🔥 Burnout detected, entering recovery mode for 48 hours');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        burnout_risk: analysis.risk,
        ...(detectedAt && { burnout_detected_at: detectedAt.toISOString() }),
        ...(recoveryUntil && { burnout_recovery_until: recoveryUntil.toISOString() }),
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update burnout status:', error);
    return false;
  }
}

/**
 * Get burnout status for use in other systems
 */
export async function getBurnoutStatus(userId: string): Promise<BurnoutAnalysis> {
  return analyzeBurnoutRisk(userId);
}

/**
 * Helper: Get cognitive load history
 */
async function getCognitiveLoadHistory(userId: string, days: number) {
  // Query memory journal for cognitive load indicators
  const { data } = await supabase
    .from('memory_journal')
    .select('date, mood, tasks_created, tasks_completed')
    .eq('user_id', userId)
    .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (!data) return [];

  // Infer cognitive load from activity patterns
  return data.map(entry => ({
    date: entry.date,
    level: (entry.tasks_created || 0) > 10 || entry.mood === 'stressed' ? 'HIGH' : 'MEDIUM',
  }));
}

/**
 * Helper: Get fatigue history from journal
 */
async function getFatigueHistory(userId: string, days: number) {
  const { data } = await supabase
    .from('memory_journal')
    .select('date, emotional_state')
    .eq('user_id', userId)
    .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('date', { ascending: false });

  return data || [];
}

/**
 * Helper: Check missed focus days
 */
async function checkMissedFocusDays(userId: string, consecutiveDays: number): Promise<number> {
  const { data: focusHistory } = await supabase
    .from('daily_focus_history')
    .select('date, outcome')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(7);

  if (!focusHistory || focusHistory.length === 0) return 0;

  let missedCount = 0;
  const today = new Date().toISOString().split('T')[0];
  
  // Check last 2 days for missed focus
  for (let i = 1; i <= consecutiveDays; i++) {
    const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const entry = focusHistory.find(h => h.date === checkDate);
    
    if (!entry || entry.outcome === 'missed') {
      missedCount++;
    } else {
      break; // Not consecutive anymore
    }
  }

  return missedCount;
}

/**
 * Auto-check burnout periodically (call from main app)
 */
export const startBurnoutMonitoring = () => {
  // Check burnout status every 6 hours
  setInterval(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await updateBurnoutStatus(user.id);
    }
  }, 6 * 60 * 60 * 1000);
};
