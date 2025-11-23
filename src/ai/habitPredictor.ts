import { supabase } from "@/integrations/supabase/client";
import { useEmotionalMemory } from "@/state/emotionalMemory";

export interface HabitPrediction {
  taskId?: string;
  predictedCategory: string;
  confidence: number;
  suggestion: string;
  consistencyScore?: number;
}

interface HabitLog {
  task_id?: string;
  task_category: string;
  task_title: string;
  time_of_day: string;
  day_of_week: number;
  task_duration_minutes?: number;
}

/**
 * Get time of day category
 */
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Log a completed task as a habit entry
 */
export async function logHabitCompletion(
  taskId: string,
  taskCategory: string,
  taskTitle: string,
  taskDurationMinutes?: number
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const habitLog: HabitLog = {
      task_id: taskId,
      task_category: taskCategory,
      task_title: taskTitle,
      time_of_day: getTimeOfDay(),
      day_of_week: now.getDay(),
      task_duration_minutes: taskDurationMinutes,
    };

    const { error } = await supabase
      .from('habit_logs')
      .insert({
        user_id: user.id,
        ...habitLog,
      });

    if (error) {
      console.error('Failed to log habit:', error);
    }
  } catch (error) {
    console.error('Error logging habit:', error);
  }
}

/**
 * Get predicted habit based on current context
 */
export async function getPredictedHabit(): Promise<HabitPrediction | null> {
  try {
    const { data, error } = await supabase.functions.invoke('habit-predictor', {
      body: {}
    });

    if (error) {
      console.error('Failed to get habit prediction:', error);
      return null;
    }

    if (!data?.prediction || data.prediction.confidence < 0.65) {
      return null;
    }

    return data.prediction;
  } catch (error) {
    console.error('Error getting habit prediction:', error);
    return null;
  }
}

/**
 * Update emotional memory based on habit consistency
 */
export async function updateHabitMemoryScore(consistencyScore: number): Promise<void> {
  const emotionalMemory = useEmotionalMemory.getState();
  
  if (consistencyScore >= 70) {
    // High consistency → joy++
    emotionalMemory.adjustJoy(5);
  } else if (consistencyScore < 40) {
    // Low consistency → fatigue++
    emotionalMemory.adjustFatigue(3);
  }
}

/**
 * Record user rejection of a prediction (lowers confidence)
 */
export async function recordPredictionRejection(
  predictedCategory: string
): Promise<void> {
  // This could be expanded to store rejection patterns in the future
  console.log('User rejected prediction for category:', predictedCategory);
  
  // Slight fatigue increase for misalignment
  const emotionalMemory = useEmotionalMemory.getState();
  emotionalMemory.adjustFatigue(1);
}

/**
 * Cleanup old habit logs (called periodically)
 */
export async function cleanupOldHabitLogs(): Promise<void> {
  try {
    const { error } = await supabase.rpc('cleanup_old_habit_logs');
    if (error) {
      console.error('Failed to cleanup old habit logs:', error);
    }
  } catch (error) {
    console.error('Error cleaning up habit logs:', error);
  }
}