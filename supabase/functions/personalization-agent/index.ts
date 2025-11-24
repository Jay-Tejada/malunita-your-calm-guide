import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskAnalysis {
  topCategories: Array<{ category: string; count: number; percentage: number }>;
  preferredInputTime: string;
  totalTasks: number;
  completionRate: number;
  avgTasksPerDay: number;
  voiceVsTextRatio: { voice: number; text: number };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting personalization agent...');

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all users
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (profilesError) {
      throw profilesError;
    }

    console.log(`Processing ${profiles.length} users...`);

    let processedCount = 0;
    let errorCount = 0;

    for (const profile of profiles) {
      try {
        await processUserPersonalization(supabaseAdmin, profile.id);
        processedCount++;
      } catch (error) {
        console.error(`Error processing user ${profile.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Personalization complete: ${processedCount} processed, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        errors: errorCount 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Personalization agent error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processUserPersonalization(
  supabaseAdmin: any,
  userId: string
) {
  // Fetch user's tasks from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: tasks, error: tasksError } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (tasksError) {
    throw tasksError;
  }

  if (!tasks || tasks.length === 0) {
    console.log(`No tasks found for user ${userId} in last 30 days`);
    return;
  }

  // Analyze task patterns
  const analysis = analyzeTaskPatterns(tasks);

  // Fetch focus history to track ONE thing patterns
  const { data: focusHistory, error: focusError } = await supabaseAdmin
    .from('daily_focus_history')
    .select('cluster_label, outcome, date')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .not('cluster_label', 'is', null)
    .order('date', { ascending: false });

  if (focusError) {
    console.log('Error fetching focus history:', focusError);
  }

  // Calculate focus preferences with reinforcement learning
  const focusPreferences = await calculateFocusPreferencesWithReinforcement(
    supabaseAdmin,
    userId,
    focusHistory || [],
    tasks
  );

  // Generate AI insights using Lovable AI
  const insights = await generateAIInsights(analysis, tasks);

  // Update profile with insights and focus preferences
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      insights: {
        topCategories: analysis.topCategories,
        preferredInputTime: analysis.preferredInputTime,
        completionRate: analysis.completionRate,
        avgTasksPerDay: analysis.avgTasksPerDay,
        voiceVsTextRatio: analysis.voiceVsTextRatio,
        lastAnalyzed: new Date().toISOString(),
      },
      preferences_summary: insights,
      focus_preferences: focusPreferences,
      last_personalization_run: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  console.log(`Updated personalization for user ${userId}`);
}

function analyzeTaskPatterns(tasks: any[]): TaskAnalysis {
  // Count tasks by category
  const categoryCount: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};
  let completedCount = 0;
  let voiceCount = 0;
  let textCount = 0;

  tasks.forEach(task => {
    // Count categories
    const category = task.category || task.custom_category_id || 'inbox';
    categoryCount[category] = (categoryCount[category] || 0) + 1;

    // Track creation hour
    const hour = new Date(task.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;

    // Count completed tasks
    if (task.completed) {
      completedCount++;
    }

    // Count input methods
    if (task.input_method === 'voice') {
      voiceCount++;
    } else {
      textCount++;
    }
  });

  // Get top 3 categories
  const sortedCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / tasks.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Determine preferred input time
  const peakHour = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])[0];

  const preferredTime = peakHour 
    ? getTimeOfDay(parseInt(peakHour[0]))
    : 'morning';

  return {
    topCategories: sortedCategories,
    preferredInputTime: preferredTime,
    totalTasks: tasks.length,
    completionRate: Math.round((completedCount / tasks.length) * 100),
    avgTasksPerDay: Math.round((tasks.length / 30) * 10) / 10,
    voiceVsTextRatio: {
      voice: Math.round((voiceCount / tasks.length) * 100),
      text: Math.round((textCount / tasks.length) * 100),
    },
  };
}

function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

async function generateAIInsights(
  analysis: TaskAnalysis,
  tasks: any[]
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `Analyze this user's task management patterns and provide personalized insights:

Task Statistics:
- Total tasks in last 30 days: ${analysis.totalTasks}
- Completion rate: ${analysis.completionRate}%
- Average tasks per day: ${analysis.avgTasksPerDay}
- Preferred input time: ${analysis.preferredInputTime}
- Input method: ${analysis.voiceVsTextRatio.voice}% voice, ${analysis.voiceVsTextRatio.text}% text

Top Categories:
${analysis.topCategories.map(c => `- ${c.category}: ${c.count} tasks (${c.percentage}%)`).join('\n')}

Recent Task Titles (sample):
${tasks.slice(0, 10).map(t => `- ${t.title}`).join('\n')}

Generate a brief, personalized summary (2-3 sentences) with:
1. Their main focus areas
2. Their productivity pattern
3. One specific recommendation to improve their workflow

Keep it conversational and encouraging.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful productivity coach analyzing task patterns to provide personalized insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return generateFallbackInsights(analysis);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return generateFallbackInsights(analysis);
  }
}

function generateFallbackInsights(analysis: TaskAnalysis): string {
  const topCategory = analysis.topCategories[0]?.category || 'various areas';
  const timeOfDay = analysis.preferredInputTime;
  
  return `You're most productive in the ${timeOfDay}, focusing primarily on ${topCategory}. With a ${analysis.completionRate}% completion rate and ${analysis.avgTasksPerDay} tasks per day, you're maintaining good momentum. Consider batching similar tasks together to boost efficiency even further.`;
}

async function calculateFocusPreferencesWithReinforcement(
  supabaseAdmin: any,
  userId: string,
  focusHistory: any[],
  tasks: any[]
): Promise<Record<string, number>> {
  if (!focusHistory || focusHistory.length === 0) {
    return {};
  }

  // Count frequency of each cluster label (baseline weights)
  const clusterCounts: Record<string, number> = {};
  focusHistory.forEach(entry => {
    if (entry.cluster_label) {
      clusterCounts[entry.cluster_label] = (clusterCounts[entry.cluster_label] || 0) + 1;
    }
  });

  const totalFocusTasks = focusHistory.length;
  const weights: Record<string, number> = {};

  // Calculate baseline weights for each cluster
  Object.entries(clusterCounts).forEach(([cluster, count]) => {
    const frequency = count / totalFocusTasks;
    
    if (frequency > 0.3) {
      weights[cluster] = 0.15;
    } else if (frequency > 0.15) {
      weights[cluster] = 0.08;
    } else if (frequency > 0.05) {
      weights[cluster] = 0;
    } else {
      weights[cluster] = -0.05;
    }
  });

  // Apply reinforcement learning based on ONE-thing completion behavior
  for (const entry of focusHistory) {
    const cluster = entry.cluster_label;
    const outcome = entry.outcome;
    const date = entry.date;

    // Get tasks from that day to analyze patterns
    const { data: dayTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, title, category, primary_focus_alignment, completed, created_at')
      .eq('user_id', userId)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);

    if (!dayTasks || dayTasks.length === 0) continue;

    // Check if ONE thing was completed
    const oneThing = dayTasks.find((t: any) => t.primary_focus_alignment === 'aligned' && t.completed);
    const oneThingMissed = !oneThing && outcome !== 'achieved';

    if (oneThing) {
      // ONE THING COMPLETED - Reinforce success
      console.log(`ONE thing completed on ${date}: reinforcing cluster ${cluster}`);
      
      // Increase weight for this cluster by +0.2
      weights[cluster] = (weights[cluster] || 0) + 0.2;

      // Reduce weight for distracting categories by -0.1
      const distractingCategories = dayTasks
        .filter((t: any) => t.primary_focus_alignment === 'distracting')
        .map((t: any) => t.category)
        .filter((c: any): c is string => typeof c === 'string');

      const uniqueDistractingCategories = [...new Set(distractingCategories)];
      for (const category of uniqueDistractingCategories) {
        const key = String(category);
        weights[key] = (weights[key] || 0) - 0.1;
      }

    } else if (oneThingMissed) {
      // ONE THING AVOIDED/MISSED - Gentle correction
      console.log(`ONE thing missed on ${date}: reducing weight for cluster ${cluster}`);
      
      // Lightly reduce weight for this cluster by -0.05
      weights[cluster] = (weights[cluster] || 0) - 0.05;

      // Increase weight for smaller, easier tasks by +0.05
      // We'll use tasks completed that day as a proxy for "achievable" tasks
      const completedTasksCategories = dayTasks
        .filter((t: any) => t.completed && t.category)
        .map((t: any) => String(t.category));

      const uniqueCompletedCategories = [...new Set(completedTasksCategories)];
      for (const category of uniqueCompletedCategories) {
        const key = String(category);
        weights[key] = (weights[key] || 0) + 0.05;
      }
    }
  }

  // Clamp weights to reasonable bounds (-0.3 to +0.5)
  Object.keys(weights).forEach(key => {
    weights[key] = Math.max(-0.3, Math.min(0.5, weights[key]));
  });

  console.log('Calculated focus preferences with reinforcement:', weights);
  return weights;
}