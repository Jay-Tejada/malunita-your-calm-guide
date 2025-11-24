import { supabase } from '@/integrations/supabase/client';

export interface PriorityStorm {
  date: string; // ISO date string (YYYY-MM-DD)
  expected_load_score: number; // 0-100
  recommended_focus_task?: string;
  task_count: number;
  deadline_count: number;
  recurrence_count: number;
  cluster_density: Record<string, number>; // category -> count
}

/**
 * Predict high cognitive load days for the next 14 days
 */
export async function predictPriorityStorms(userId: string): Promise<PriorityStorm[]> {
  try {
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);

    // Fetch all future tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .or(`reminder_time.gte.${today.toISOString()},recurrence_pattern.neq.none`);

    if (error) throw error;
    if (!tasks || tasks.length === 0) return [];

    // Map to track predictions for each day
    const dayPredictions = new Map<string, PriorityStorm>();

    // Initialize next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      dayPredictions.set(dateStr, {
        date: dateStr,
        expected_load_score: 0,
        task_count: 0,
        deadline_count: 0,
        recurrence_count: 0,
        cluster_density: {},
      });
    }

    // Analyze each task
    for (const task of tasks) {
      // Handle tasks with reminder times
      if (task.reminder_time) {
        const reminderDate = new Date(task.reminder_time);
        const dateStr = reminderDate.toISOString().split('T')[0];
        
        if (dayPredictions.has(dateStr)) {
          const prediction = dayPredictions.get(dateStr)!;
          prediction.task_count++;
          prediction.deadline_count++;
          
          // Track cluster density
          const category = task.category || 'uncategorized';
          prediction.cluster_density[category] = (prediction.cluster_density[category] || 0) + 1;
        }
      }

      // Handle recurring tasks
      if (task.recurrence_pattern && task.recurrence_pattern !== 'none') {
        const recurrenceDates = getRecurrenceDates(task, today, twoWeeksFromNow);
        
        for (const date of recurrenceDates) {
          const dateStr = date.toISOString().split('T')[0];
          
          if (dayPredictions.has(dateStr)) {
            const prediction = dayPredictions.get(dateStr)!;
            prediction.task_count++;
            prediction.recurrence_count++;
            
            const category = task.category || 'uncategorized';
            prediction.cluster_density[category] = (prediction.cluster_density[category] || 0) + 1;
          }
        }
      }
    }

    // Calculate load scores and identify recommended focus tasks
    const storms: PriorityStorm[] = [];
    
    for (const prediction of dayPredictions.values()) {
      // Calculate load score (0-100)
      let loadScore = 0;
      
      // Base score from task count (max 40 points)
      loadScore += Math.min(prediction.task_count * 5, 40);
      
      // Deadline pressure (max 30 points)
      loadScore += Math.min(prediction.deadline_count * 10, 30);
      
      // Recurrence overload (max 20 points)
      loadScore += Math.min(prediction.recurrence_count * 5, 20);
      
      // Cluster density penalty (max 10 points)
      const uniqueClusters = Object.keys(prediction.cluster_density).length;
      if (uniqueClusters > 3) {
        loadScore += Math.min((uniqueClusters - 3) * 5, 10);
      }
      
      prediction.expected_load_score = Math.min(loadScore, 100);
      
      // Identify recommended focus task for high-load days
      if (prediction.expected_load_score >= 60) {
        const dominantCluster = Object.entries(prediction.cluster_density)
          .sort((a, b) => b[1] - a[1])[0];
        
        if (dominantCluster) {
          prediction.recommended_focus_task = `Focus on ${dominantCluster[0]} tasks - ${dominantCluster[1]} items`;
        }
      }
      
      storms.push(prediction);
    }

    return storms.sort((a, b) => b.expected_load_score - a.expected_load_score);
  } catch (error) {
    console.error('Failed to predict priority storms:', error);
    return [];
  }
}

/**
 * Calculate recurrence dates within a date range
 */
function getRecurrenceDates(task: any, startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const pattern = task.recurrence_pattern;
  
  if (!pattern || pattern === 'none') return dates;
  
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (pattern === 'daily') {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (pattern === 'weekly' && task.recurrence_day !== null) {
      if (currentDate.getDay() === task.recurrence_day) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (pattern === 'monthly' && task.recurrence_day !== null) {
      if (currentDate.getDate() === task.recurrence_day) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    } else {
      break;
    }
    
    // Safety check for recurrence end date
    if (task.recurrence_end_date) {
      const endDate = new Date(task.recurrence_end_date);
      if (currentDate > endDate) break;
    }
  }
  
  return dates;
}

/**
 * Save storm predictions to database
 */
export async function savePriorityStorms(userId: string, storms: PriorityStorm[]): Promise<boolean> {
  try {
    // Delete existing predictions for this user
    await supabase
      .from('priority_storms')
      .delete()
      .eq('user_id', userId);
    
    // Insert new predictions
    const stormsWithUserId = storms.map(storm => ({
      user_id: userId,
      date: storm.date,
      expected_load_score: storm.expected_load_score,
      recommended_focus_task: storm.recommended_focus_task || null,
      task_count: storm.task_count,
      deadline_count: storm.deadline_count,
      recurrence_count: storm.recurrence_count,
      cluster_density: storm.cluster_density,
    }));
    
    const { error } = await supabase
      .from('priority_storms')
      .insert(stormsWithUserId);
    
    if (error) throw error;
    
    console.log(`✅ Saved ${storms.length} priority storm predictions`);
    return true;
  } catch (error) {
    console.error('Failed to save priority storms:', error);
    return false;
  }
}

/**
 * Update storm predictions for a user
 */
export async function updatePriorityStorms(userId: string): Promise<boolean> {
  const storms = await predictPriorityStorms(userId);
  return savePriorityStorms(userId, storms);
}

/**
 * Get storm prediction for a specific date
 */
export async function getStormForDate(userId: string, date: string): Promise<PriorityStorm | null> {
  try {
    const { data, error } = await supabase
      .from('priority_storms')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      date: data.date,
      expected_load_score: data.expected_load_score,
      recommended_focus_task: data.recommended_focus_task || undefined,
      task_count: data.task_count,
      deadline_count: data.deadline_count,
      recurrence_count: data.recurrence_count,
      cluster_density: data.cluster_density as Record<string, number>,
    };
  } catch (error) {
    console.error('Failed to get storm for date:', error);
    return null;
  }
}

/**
 * Get upcoming high-load days (storms with score >= 60)
 */
export async function getUpcomingStorms(userId: string, daysAhead: number = 7): Promise<PriorityStorm[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('priority_storms')
      .select('*')
      .eq('user_id', userId)
      .gte('date', today)
      .lte('date', futureDateStr)
      .gte('expected_load_score', 60)
      .order('date', { ascending: true });
    
    if (error) throw error;
    if (!data) return [];
    
    return data.map(d => ({
      date: d.date,
      expected_load_score: d.expected_load_score,
      recommended_focus_task: d.recommended_focus_task || undefined,
      task_count: d.task_count,
      deadline_count: d.deadline_count,
      recurrence_count: d.recurrence_count,
      cluster_density: d.cluster_density as Record<string, number>,
    }));
  } catch (error) {
    console.error('Failed to get upcoming storms:', error);
    return [];
  }
}
