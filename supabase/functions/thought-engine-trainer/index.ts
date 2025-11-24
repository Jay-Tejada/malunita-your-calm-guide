import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🧠 Thought Engine Trainer starting...');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, insights, created_at');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`📊 Training for ${profiles.length} users`);

    const results = [];

    for (const profile of profiles) {
      try {
        console.log(`\n👤 Training for user: ${profile.id}`);

        // 1. Analyze completed tasks
        const { data: completedTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', profile.id)
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .limit(100);

        // 2. Analyze overdue tasks
        const { data: overdueTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', profile.id)
          .eq('completed', false)
          .lt('reminder_time', new Date().toISOString())
          .not('reminder_time', 'is', null);

        // 3. Get learning feedback
        const { data: feedback } = await supabase
          .from('task_learning_feedback')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(50);

        // 4. Get recent daily sessions
        const { data: sessions } = await supabase
          .from('daily_sessions')
          .select('*')
          .eq('user_id', profile.id)
          .order('date', { ascending: false })
          .limit(30);

        // 5. Get all user tasks for pattern analysis
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(200);

        // 6. Get today's primary focus for alignment analysis
        const today = new Date().toISOString().split('T')[0];
        const { data: todayFocus } = await supabase
          .from('daily_focus_history')
          .select('focus_task, cluster_label')
          .eq('user_id', profile.id)
          .eq('date', today)
          .maybeSingle();

        // Analyze patterns
        const insights = analyzeUserPatterns({
          completedTasks: completedTasks || [],
          overdueTasks: overdueTasks || [],
          feedback: feedback || [],
          sessions: sessions || [],
          allTasks: allTasks || [],
          todayFocus: todayFocus,
        });

        console.log('💡 Generated insights:', insights);

        // Update profile with new insights
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            insights: insights,
            last_personalization_run: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`Error updating profile ${profile.id}:`, updateError);
        } else {
          console.log(`✅ Updated insights for user ${profile.id}`);
          results.push({ userId: profile.id, success: true });
        }

      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
        results.push({
          userId: profile.id,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }

    console.log('\n🎯 Training complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        processedUsers: results.length,
        results: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Thought Engine Trainer error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Analysis functions
function analyzeUserPatterns(data: {
  completedTasks: any[];
  overdueTasks: any[];
  feedback: any[];
  sessions: any[];
  allTasks: any[];
  todayFocus: any;
}) {
  const insights: any = {
    productivityPatterns: {},
    optimalTimes: {},
    projectThemes: [],
    ignoredTaskPatterns: [],
    recommendations: [],
    suggestedHabits: [],
    primaryFocusAlignment: {},
    lastUpdated: new Date().toISOString(),
  };

  // 1. Productivity patterns
  if (data.completedTasks.length > 0) {
    const completionsByDay = analyzeCompletionsByDay(data.completedTasks);
    const completionsByHour = analyzeCompletionsByHour(data.completedTasks);
    
    insights.productivityPatterns = {
      avgDailyCompletions: data.completedTasks.length / 30,
      peakDays: completionsByDay,
      completionRate: calculateCompletionRate(data.allTasks),
      streak: calculateCurrentStreak(data.completedTasks),
    };
  }

  // 2. Optimal times analysis
  insights.optimalTimes = {
    bigWork: findOptimalTimeForBigWork(data.completedTasks),
    tinyTasks: findOptimalTimeForTinyTasks(data.completedTasks),
  };

  // 3. Project themes
  insights.projectThemes = identifyProjectThemes(data.allTasks);

  // 4. Ignored tasks patterns
  insights.ignoredTaskPatterns = identifyIgnoredPatterns(data.overdueTasks);

  // 5. Primary focus alignment analysis
  insights.primaryFocusAlignment = analyzePrimaryFocusAlignment(data.allTasks, data.feedback, data.todayFocus);

  // 6. Recommendations (now includes ONE-thing alignment learning)
  insights.recommendations = generateRecommendations(data);

  // 7. Suggested habits
  insights.suggestedHabits = generateHabitSuggestions(data);

  return insights;
}

function analyzeCompletionsByDay(tasks: any[]) {
  const dayCount: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.completed_at) {
      const day = new Date(task.completed_at).toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    }
  });
  return Object.entries(dayCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day, count]) => ({ day, count }));
}

function analyzeCompletionsByHour(tasks: any[]) {
  const hourCount: Record<number, number> = {};
  tasks.forEach(task => {
    if (task.completed_at) {
      const hour = new Date(task.completed_at).getHours();
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    }
  });
  return hourCount;
}

function calculateCompletionRate(tasks: any[]) {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

function calculateCurrentStreak(completedTasks: any[]) {
  if (completedTasks.length === 0) return 0;
  
  const sortedTasks = [...completedTasks].sort((a, b) => 
    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const task of sortedTasks) {
    const taskDate = new Date(task.completed_at);
    taskDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff > streak) {
      break;
    }
  }
  
  return streak;
}

function findOptimalTimeForBigWork(tasks: any[]) {
  const bigTasks = tasks.filter(t => 
    t.title.length > 50 || 
    t.title.toLowerCase().includes('project') ||
    t.title.toLowerCase().includes('plan')
  );
  
  const hourCount = analyzeCompletionsByHour(bigTasks);
  const bestHour = Object.entries(hourCount)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (bestHour) {
    const hour = parseInt(bestHour[0]);
    return `${hour}:00 - ${hour + 2}:00`;
  }
  
  return 'Morning (9-11am)'; // Default
}

function findOptimalTimeForTinyTasks(tasks: any[]) {
  const tinyTasks = tasks.filter(t => t.title.split(' ').length <= 5);
  
  const hourCount = analyzeCompletionsByHour(tinyTasks);
  const bestHour = Object.entries(hourCount)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (bestHour) {
    const hour = parseInt(bestHour[0]);
    return `${hour}:00 - ${hour + 1}:00`;
  }
  
  return 'Afternoon (2-4pm)'; // Default
}

function identifyProjectThemes(tasks: any[]) {
  const themes: Record<string, number> = {};
  
  tasks.forEach(task => {
    const words = task.title.toLowerCase().split(/\s+/);
    const importantWords = words.filter((w: string) => 
      w.length > 4 && 
      !['about', 'should', 'would', 'could', 'needs'].includes(w)
    );
    
    importantWords.forEach((word: string) => {
      themes[word] = (themes[word] || 0) + 1;
    });
  });
  
  return Object.entries(themes)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => ({ theme, occurrences: count }));
}

function identifyIgnoredPatterns(overdueTasks: any[]) {
  if (overdueTasks.length === 0) return [];
  
  const patterns: Record<string, number> = {};
  
  overdueTasks.forEach(task => {
    if (task.category) {
      patterns[task.category] = (patterns[task.category] || 0) + 1;
    }
  });
  
  return Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pattern, count]) => ({
      pattern,
      count,
      suggestion: `You tend to postpone ${pattern} tasks. Consider breaking them down.`
    }));
}

function generateRecommendations(data: any) {
  const recommendations = [];
  
  // Check completion rate
  const completionRate = calculateCompletionRate(data.allTasks);
  if (completionRate < 50) {
    recommendations.push({
      type: 'completion_rate',
      message: 'Your completion rate is low. Try focusing on 3 tasks per day.',
    });
  }
  
  // Check for overdue tasks
  if (data.overdueTasks.length > 5) {
    recommendations.push({
      type: 'overdue_management',
      message: `You have ${data.overdueTasks.length} overdue tasks. Consider rescheduling or breaking them down.`,
    });
  }
  
  // Check for task corrections
  const corrections = data.feedback.filter((f: any) => f.was_corrected);
  if (corrections.length > 5) {
    recommendations.push({
      type: 'auto_categorization',
      message: 'AI is learning your preferences. Keep correcting for better suggestions.',
    });
  }
  
  // Check session consistency
  if (data.sessions.length < 10) {
    recommendations.push({
      type: 'daily_sessions',
      message: 'Try using daily planning sessions to stay organized.',
    });
  }
  
  return recommendations.slice(0, 5);
}

function generateHabitSuggestions(data: any) {
  const habits = [];
  
  // Morning planning habit
  const hasMorningSessions = data.sessions.some((s: any) => {
    const hour = new Date(s.created_at).getHours();
    return hour >= 6 && hour <= 10;
  });
  
  if (!hasMorningSessions) {
    habits.push({
      habit: 'Morning Planning',
      description: 'Start your day with a 5-minute planning session',
      frequency: 'daily',
      timeOfDay: 'morning',
    });
  }
  
  // Task batching for tiny tasks
  const tinyTasks = data.allTasks.filter((t: any) => t.title.split(' ').length <= 5);
  if (tinyTasks.length >= 10) {
    habits.push({
      habit: 'Tiny Task Fiesta',
      description: 'Bundle 5-10 quick tasks into a focused 15-minute session',
      frequency: 'weekly',
      timeOfDay: 'afternoon',
    });
  }
  
  // Weekly review
  habits.push({
    habit: 'Weekly Review',
    description: 'Review what worked and adjust your approach',
    frequency: 'weekly',
    timeOfDay: 'friday_afternoon',
  });
  
  return habits.slice(0, 5);
}

function analyzePrimaryFocusAlignment(allTasks: any[], feedback: any[], todayFocus: any) {
  // Analyze how well the AI understands alignment with ONE-thing priorities
  const alignmentAnalysis: {
    alignedTasksCompleted: number;
    distractingTasksCompleted: number;
    neutralTasksCompleted: number;
    alignmentAccuracy: number;
    correctionPatterns: Array<{
      suggestedAlignment: string;
      actualAlignment: string;
      taskTitle: string;
    }>;
    learningWeight: number;
  } = {
    alignedTasksCompleted: 0,
    distractingTasksCompleted: 0,
    neutralTasksCompleted: 0,
    alignmentAccuracy: 0,
    correctionPatterns: [],
    learningWeight: 0.5, // Start neutral, adjust based on corrections
  };

  if (!todayFocus) {
    return alignmentAnalysis;
  }

  // Count completed tasks by alignment
  const completedWithAlignment = allTasks.filter(t => t.completed && t.primary_focus_alignment);
  completedWithAlignment.forEach(task => {
    if (task.primary_focus_alignment === 'aligned') {
      alignmentAnalysis.alignedTasksCompleted++;
    } else if (task.primary_focus_alignment === 'distracting') {
      alignmentAnalysis.distractingTasksCompleted++;
    } else {
      alignmentAnalysis.neutralTasksCompleted++;
    }
  });

  // Analyze feedback corrections related to alignment
  const alignmentCorrections = feedback.filter((f: any) => 
    f.was_corrected && 
    (f.actual_category === 'aligned' || f.actual_category === 'distracting' || f.actual_category === 'neutral')
  );

  if (alignmentCorrections.length > 0) {
    alignmentAnalysis.correctionPatterns = alignmentCorrections.map((f: any) => ({
      suggestedAlignment: f.suggested_category,
      actualAlignment: f.actual_category,
      taskTitle: f.task_title,
    }));

    // Calculate accuracy
    const correctAlignments = alignmentCorrections.filter((f: any) => 
      f.suggested_category === f.actual_category
    ).length;
    alignmentAnalysis.alignmentAccuracy = correctAlignments / alignmentCorrections.length;

    // Adjust learning weight based on accuracy
    // Higher weight = trust AI more, lower weight = rely more on user corrections
    if (alignmentAnalysis.alignmentAccuracy > 0.8) {
      alignmentAnalysis.learningWeight = 0.7; // AI is accurate, boost its confidence
    } else if (alignmentAnalysis.alignmentAccuracy < 0.5) {
      alignmentAnalysis.learningWeight = 0.3; // AI is struggling, reduce confidence
    }
  }

  return alignmentAnalysis;
}
