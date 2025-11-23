import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

export interface MonthlyData {
  month: string;
  tasksCompleted: number;
  tasksCreated: number;
  topCategories: Array<{ category: string; count: number }>;
  streaks: {
    taskCompletion: number;
    reflection: number;
  };
  emotionalTrends: {
    avgJoy: number;
    avgStress: number;
    avgAffection: number;
    avgFatigue: number;
    joyPeaks: number;
    stressSpikes: number;
  };
  moodDistribution: Record<string, number>;
  ritualConsistency: {
    morningCount: number;
    eveningCount: number;
    totalDays: number;
  };
}

export interface MonthlyInsight {
  id: string;
  month: string;
  wins: string[];
  challenges: string[];
  emergingHabits: string[];
  focusNext: string;
  generatedAt: string;
  rawData: MonthlyData;
}

export async function aggregateMonthlyData(monthOffset: number = 0): Promise<MonthlyData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const targetDate = subMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  
  const monthStr = format(monthStart, 'yyyy-MM');

  // Fetch tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString());

  const tasksCompleted = tasks?.filter(t => t.completed).length || 0;
  const tasksCreated = tasks?.length || 0;

  // Category distribution
  const categoryCount: Record<string, number> = {};
  tasks?.forEach(task => {
    if (task.category) {
      categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
    }
  });
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  // Fetch journal entries for emotional trends
  const { data: journalEntries } = await supabase
    .from('memory_journal')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'));

  let avgJoy = 0, avgStress = 0, avgAffection = 0, avgFatigue = 0;
  let joyPeaks = 0, stressSpikes = 0;
  const moodCount: Record<string, number> = {};

  if (journalEntries && journalEntries.length > 0) {
    journalEntries.forEach(entry => {
      const state = entry.emotional_state as any;
      avgJoy += state.joy || 0;
      avgStress += state.stress || 0;
      avgAffection += state.affection || 0;
      avgFatigue += state.fatigue || 0;
      
      if (state.joy >= 80) joyPeaks++;
      if (state.stress >= 75) stressSpikes++;
      
      moodCount[entry.mood] = (moodCount[entry.mood] || 0) + 1;
    });
    
    const count = journalEntries.length;
    avgJoy = Math.round(avgJoy / count);
    avgStress = Math.round(avgStress / count);
    avgAffection = Math.round(avgAffection / count);
    avgFatigue = Math.round(avgFatigue / count);
  }

  // Fetch daily sessions for ritual consistency
  const { data: sessions } = await supabase
    .from('daily_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'));

  const morningCount = sessions?.filter(s => s.top_focus).length || 0;
  const eveningCount = sessions?.filter(s => s.reflection_wins || s.reflection_improve).length || 0;
  const totalDays = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));

  // Fetch profile for streaks
  const { data: profile } = await supabase
    .from('profiles')
    .select('task_completion_streak, reflection_streak')
    .eq('id', user.id)
    .single();

  return {
    month: monthStr,
    tasksCompleted,
    tasksCreated,
    topCategories,
    streaks: {
      taskCompletion: profile?.task_completion_streak || 0,
      reflection: profile?.reflection_streak || 0,
    },
    emotionalTrends: {
      avgJoy,
      avgStress,
      avgAffection,
      avgFatigue,
      joyPeaks,
      stressSpikes,
    },
    moodDistribution: moodCount,
    ritualConsistency: {
      morningCount,
      eveningCount,
      totalDays,
    },
  };
}

export async function generateMonthlyInsight(data: MonthlyData): Promise<MonthlyInsight> {
  const { data: result, error } = await supabase.functions.invoke('generate-monthly-insights', {
    body: { data }
  });

  if (error) throw error;
  
  return {
    id: crypto.randomUUID(),
    month: data.month,
    wins: result.wins,
    challenges: result.challenges,
    emergingHabits: result.emergingHabits,
    focusNext: result.focusNext,
    generatedAt: new Date().toISOString(),
    rawData: data,
  };
}
