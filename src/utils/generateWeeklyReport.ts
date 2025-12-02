import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, subWeeks, getHours } from 'date-fns';

export interface WeeklyReportMetrics {
  tasksCompleted: number;
  avgPerDay: string;
  flowSessions: number;
  journalEntries: number;
  habitCompletionRate: number;
  longestHabitStreak: number;
  focusHours: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  summary: string;
  insights: string[];
  metrics: WeeklyReportMetrics;
  tasksByDay: Record<string, number>;
  tasksByCategory: Record<string, number>;
  mostProductiveDay: string | null;
  peakHour: string | null;
  companionMessage: string;
  topCategories: Array<{ category: string; count: number }>;
  wins: string[];
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h} ${ampm}`;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function generateCompanionReflection(metrics: WeeklyReportMetrics, mostProductiveDay: string | null): string {
  const messages: string[] = [];
  
  if (metrics.tasksCompleted >= 20) {
    messages.push("What a productive week! You've been absolutely crushing it.");
  } else if (metrics.tasksCompleted >= 10) {
    messages.push("Solid progress this week. Consistency is key, and you're showing it.");
  } else if (metrics.tasksCompleted > 0) {
    messages.push("Every completed task is a step forward. Keep building momentum.");
  } else {
    messages.push("A fresh week awaits. What's one thing you want to accomplish?");
  }

  if (metrics.habitCompletionRate >= 80) {
    messages.push("Your habits are becoming second nature — that's real growth.");
  } else if (metrics.habitCompletionRate >= 50) {
    messages.push("Good effort on your habits. Try pairing them with something you already do daily.");
  }

  if (metrics.journalEntries > 0) {
    messages.push("I noticed you took time to journal. Reflection is a superpower.");
  }

  if (mostProductiveDay) {
    messages.push(`${mostProductiveDay}s seem to be your power day. Let's make next ${mostProductiveDay} count.`);
  }

  return messages.join(' ');
}

export async function generateWeeklyReport(weekOffset: number = 0): Promise<WeeklyReport | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const targetDate = weekOffset === 0 ? new Date() : subWeeks(new Date(), Math.abs(weekOffset));
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

    // Fetch all data in parallel
    const [tasksResult, flowResult, journalResult, habitsResult, habitCompletionsResult] = await Promise.all([
      // Completed tasks this week
      supabase
        .from('tasks')
        .select('id, title, category, completed_at')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', weekStart.toISOString())
        .lte('completed_at', weekEnd.toISOString()),
      
      // Flow sessions
      supabase
        .from('flow_sessions')
        .select('id, title, target_duration_minutes, tasks_completed, ended_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('ended_at', weekStart.toISOString())
        .lte('ended_at', weekEnd.toISOString()),
      
      // Journal entries
      supabase
        .from('journal_entries')
        .select('id, title')
        .eq('user_id', user.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString()),
      
      // Habits (active)
      supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('archived', false),
      
      // Habit completions this week
      supabase
        .from('habit_completions')
        .select('id, habit_id, date')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr),
    ]);

    const completedTasks = tasksResult.data || [];
    const flowSessions = flowResult.data || [];
    const journalEntries = journalResult.data || [];
    const habits = habitsResult.data || [];
    const habitCompletions = habitCompletionsResult.data || [];

    // Analyze tasks by day
    const tasksByDay = groupBy(completedTasks, t => 
      format(new Date(t.completed_at!), 'EEEE')
    );
    const tasksByDayCount: Record<string, number> = {};
    Object.entries(tasksByDay).forEach(([day, tasks]) => {
      tasksByDayCount[day] = tasks.length;
    });

    // Most productive day
    const mostProductiveDay = Object.entries(tasksByDayCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Peak hour
    const tasksByHour = groupBy(completedTasks, t => 
      String(getHours(new Date(t.completed_at!)))
    );
    const peakHourNum = Object.entries(tasksByHour)
      .sort((a, b) => b[1].length - a[1].length)[0]?.[0];
    const peakHour = peakHourNum ? formatHour(parseInt(peakHourNum)) : null;

    // Tasks by category
    const tasksByCategory = groupBy(completedTasks, t => t.category || 'uncategorized');
    const tasksByCategoryCount: Record<string, number> = {};
    Object.entries(tasksByCategory).forEach(([cat, tasks]) => {
      tasksByCategoryCount[cat] = tasks.length;
    });

    // Top categories
    const topCategories = Object.entries(tasksByCategoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Habit completion rate
    const totalPossibleHabitDays = habits.length * 7;
    const habitCompletionRate = totalPossibleHabitDays > 0 
      ? Math.round((habitCompletions.length / totalPossibleHabitDays) * 100)
      : 0;

    // Calculate longest streak (simplified)
    const uniqueCompletionDays = new Set(habitCompletions.map(h => h.date)).size;

    // Focus hours from flow sessions
    const focusMinutes = flowSessions.reduce((sum, s) => sum + (s.target_duration_minutes || 0), 0);
    const focusHours = Math.round(focusMinutes / 60 * 10) / 10;

    // Build metrics
    const avgPerDay = (completedTasks.length / 7).toFixed(1);
    const metrics: WeeklyReportMetrics = {
      tasksCompleted: completedTasks.length,
      avgPerDay,
      flowSessions: flowSessions.length,
      journalEntries: journalEntries.length,
      habitCompletionRate,
      longestHabitStreak: uniqueCompletionDays,
      focusHours,
    };

    // Generate insights
    const insights: string[] = [];
    if (mostProductiveDay) {
      insights.push(`Your most productive day was ${mostProductiveDay} with ${tasksByDayCount[mostProductiveDay]} tasks.`);
    }
    if (peakHour) {
      insights.push(`Peak focus time: around ${peakHour}.`);
    }
    if (flowSessions.length > 0) {
      const totalFlowTasks = flowSessions.reduce((sum, s) => sum + (s.tasks_completed || 0), 0);
      insights.push(`${flowSessions.length} Flow Sessions completed${totalFlowTasks > 0 ? ` (${totalFlowTasks} tasks)` : ''}.`);
    }
    if (habitCompletionRate >= 70) {
      insights.push(`Great habit consistency at ${habitCompletionRate}%!`);
    }
    if (topCategories.length > 0 && topCategories[0].count >= 3) {
      insights.push(`Most active category: ${topCategories[0].category} (${topCategories[0].count} tasks).`);
    }

    // Generate wins
    const wins: string[] = [];
    if (completedTasks.length >= 10) wins.push(`Completed ${completedTasks.length} tasks`);
    if (flowSessions.length >= 3) wins.push('Multiple Flow Sessions');
    if (habitCompletionRate >= 80) wins.push('Strong habit streak');
    if (journalEntries.length >= 3) wins.push('Consistent journaling');

    // Summary
    const summary = completedTasks.length > 0
      ? `You completed ${completedTasks.length} tasks this week, averaging ${avgPerDay} per day.`
      : 'A fresh week to make progress. What matters most to you?';

    // Companion message
    const companionMessage = generateCompanionReflection(metrics, mostProductiveDay);

    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      summary,
      insights,
      metrics,
      tasksByDay: tasksByDayCount,
      tasksByCategory: tasksByCategoryCount,
      mostProductiveDay,
      peakHour,
      companionMessage,
      topCategories,
      wins,
    };
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return null;
  }
}
