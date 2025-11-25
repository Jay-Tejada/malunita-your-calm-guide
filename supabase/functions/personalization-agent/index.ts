import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Check if specific user was requested
    let body: { userId?: string } = {};
    try {
      const text = await req.text();
      if (text && text.trim().length > 0) {
        body = JSON.parse(text);
      }
    } catch (error) {
      console.log('No valid JSON body, processing all users');
      body = {};
    }
    
    const targetUserId = body.userId;

    if (targetUserId) {
      // Process single user
      console.log(`Processing single user: ${targetUserId}`);
      const result = await processUserPersonalization(supabaseAdmin, targetUserId);
      
      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

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
    const results: any[] = [];

    for (const profile of profiles) {
      try {
        const result = await processUserPersonalization(supabaseAdmin, profile.id);
        results.push({ userId: profile.id, ...result });
        processedCount++;
      } catch (error) {
        console.error(`Error processing user ${profile.id}:`, error);
        errorCount++;
        results.push({ 
          userId: profile.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    console.log(`Personalization complete: ${processedCount} processed, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        errors: errorCount,
        results: results
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
  console.log(`Processing memory profile for user ${userId}`);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // 1. PULL ALL DATA SOURCES
  console.log('Fetching data sources...');
  
  // AI Corrections
  const { data: corrections } = await supabaseAdmin
    .from('ai_corrections')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString());
  
  // Task History
  const { data: tasks } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString());
  
  // Daily Summaries
  const { data: dailySessions } = await supabaseAdmin
    .from('daily_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0]);
  
  // Emotional History
  const { data: emotionalHistory } = await supabaseAdmin
    .from('memory_journal')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0]);
  
  // Companion Interactions
  const { data: companionEvents } = await supabaseAdmin
    .from('memory_events')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString());
  
  console.log(`Loaded: ${corrections?.length || 0} corrections, ${tasks?.length || 0} tasks, ${dailySessions?.length || 0} sessions, ${emotionalHistory?.length || 0} journal entries, ${companionEvents?.length || 0} events`);
  
  // 2. COMPUTE MEMORY PROFILE
  console.log('Computing memory profile...');
  
  // Category Preference Weights
  const categoryPreferences = computeCategoryPreferences(corrections || [], tasks || []);
  
  // Priority Patterns
  const priorityBias = computePriorityBias(corrections || [], tasks || []);
  
  // Writing Style
  const writingStyle = inferWritingStyle(tasks || []);
  
  // Tiny Task Threshold
  const tinyTaskThreshold = computeTinyTaskThreshold(tasks || []);
  
  // Energy/Usage Heatmaps
  const energyPattern = computeEnergyPattern(tasks || []);
  
  // Procrastination Patterns
  const procrastinationTriggers = detectProcrastinationPatterns(tasks || []);
  
  // Emotional Reward Triggers
  const { emotionalTriggers, positiveReinforcers } = extractEmotionalTriggers(
    emotionalHistory || [],
    companionEvents || []
  );
  
  // Streak History
  const streakHistory = buildStreakHistory(dailySessions || [], tasks || []);
  
  const memoryProfile = {
    writing_style: writingStyle,
    category_preferences: categoryPreferences,
    priority_bias: priorityBias,
    tiny_task_threshold: tinyTaskThreshold,
    energy_pattern: energyPattern,
    procrastination_triggers: procrastinationTriggers,
    emotional_triggers: emotionalTriggers,
    positive_reinforcers: positiveReinforcers,
    streak_history: streakHistory,
    last_updated: new Date().toISOString(),
  };
  
  console.log('Memory profile computed:', memoryProfile);
  
  // 3. UPDATE AI_MEMORY_PROFILES
  const { data: updatedProfile, error: upsertError } = await supabaseAdmin
    .from('ai_memory_profiles')
    .upsert({
      user_id: userId,
      ...memoryProfile
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();
  
  if (upsertError) {
    throw upsertError;
  }
  
  console.log(`Updated memory profile for user ${userId}`);
  
  return {
    success: true,
    updated_profile: updatedProfile
  };
}

// COMPUTATION FUNCTIONS

function computeCategoryPreferences(corrections: any[], tasks: any[]): Record<string, number> {
  const preferences: Record<string, number> = {};
  
  // Learn from corrections
  corrections.forEach(correction => {
    const correctedCategory = correction.corrected_output?.category;
    if (correctedCategory) {
      preferences[correctedCategory] = (preferences[correctedCategory] || 0) + 0.15;
    }
  });
  
  // Learn from completed tasks
  tasks.forEach(task => {
    if (task.completed && task.category) {
      preferences[task.category] = (preferences[task.category] || 0) + 0.05;
    }
  });
  
  // Normalize to 0-1 range
  const maxWeight = Math.max(...Object.values(preferences), 1);
  Object.keys(preferences).forEach(key => {
    preferences[key] = Math.min(1, preferences[key] / maxWeight);
  });
  
  return preferences;
}

function computePriorityBias(corrections: any[], tasks: any[]): Record<string, number> {
  const bias = { must: 0.5, should: 0.5, could: 0.5 };
  
  // Learn from corrections
  corrections.forEach(correction => {
    const correctedPriority = correction.corrected_output?.priority?.toLowerCase();
    if (correctedPriority && correctedPriority in bias) {
      bias[correctedPriority as keyof typeof bias] += 0.08;
    }
  });
  
  // Learn from task completion patterns
  const priorityCounts = { must: 0, should: 0, could: 0 };
  const priorityCompleted = { must: 0, should: 0, could: 0 };
  
  tasks.forEach(task => {
    const priority = task.scheduled_bucket?.toLowerCase();
    if (priority && priority in priorityCounts) {
      priorityCounts[priority as keyof typeof priorityCounts]++;
      if (task.completed) {
        priorityCompleted[priority as keyof typeof priorityCompleted]++;
      }
    }
  });
  
  // Adjust bias based on completion rates
  Object.keys(priorityCounts).forEach(priority => {
    const key = priority as keyof typeof priorityCounts;
    const completionRate = priorityCounts[key] > 0 
      ? priorityCompleted[key] / priorityCounts[key]
      : 0.5;
    bias[key] = Math.min(1, bias[key] + (completionRate - 0.5) * 0.2);
  });
  
  return bias;
}

function inferWritingStyle(tasks: any[]): string | null {
  if (tasks.length === 0) return null;
  
  const titles = tasks.map(t => t.title || '').filter(t => t.length > 0);
  if (titles.length === 0) return null;
  
  let casualCount = 0;
  let formalCount = 0;
  
  titles.forEach(title => {
    const lower = title.toLowerCase();
    if (/\b(like|just|maybe|kinda|sorta|gonna|wanna)\b/.test(lower)) {
      casualCount++;
    }
    if (/\b(please|kindly|would appreciate|regarding|pursuant)\b/.test(lower)) {
      formalCount++;
    }
  });
  
  if (formalCount > casualCount * 1.5) return 'formal';
  if (casualCount > formalCount * 1.5) return 'casual';
  return 'neutral';
}

function computeTinyTaskThreshold(tasks: any[]): number {
  const tinyTasks = tasks.filter(t => t.is_tiny_task);
  
  if (tinyTasks.length === 0) return 5; // default
  
  const titleLengths = tinyTasks
    .map(t => (t.title || '').length)
    .filter(len => len > 0);
  
  if (titleLengths.length === 0) return 5;
  
  const avgLength = titleLengths.reduce((sum, len) => sum + len, 0) / titleLengths.length;
  return Math.round(avgLength);
}

function computeEnergyPattern(tasks: any[]): Record<string, number> {
  const pattern = { morning: 0, afternoon: 0, night: 0 };
  const counts = { morning: 0, afternoon: 0, night: 0 };
  
  tasks.forEach(task => {
    const hour = new Date(task.created_at).getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'night';
    
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'night';
    
    counts[timeOfDay]++;
    
    // Weight completed tasks higher
    if (task.completed) {
      pattern[timeOfDay] += 0.1;
    } else {
      pattern[timeOfDay] += 0.03;
    }
  });
  
  // Normalize to 0-1 range
  const maxEnergy = Math.max(...Object.values(pattern), 1);
  Object.keys(pattern).forEach(key => {
    pattern[key as keyof typeof pattern] = Math.min(1, pattern[key as keyof typeof pattern] / maxEnergy);
  });
  
  return pattern;
}

function detectProcrastinationPatterns(tasks: any[]): string[] {
  const triggers: string[] = [];
  const seen = new Set<string>();
  
  // Find tasks with long completion times
  tasks.forEach(task => {
    if (task.completed && task.completed_at) {
      const createdAt = new Date(task.created_at).getTime();
      const completedAt = new Date(task.completed_at).getTime();
      const daysToComplete = (completedAt - createdAt) / (1000 * 60 * 60 * 24);
      
      if (daysToComplete > 7) {
        const category = task.category || 'uncategorized';
        if (!seen.has(category)) {
          triggers.push(category);
          seen.add(category);
        }
      }
    }
  });
  
  return triggers.slice(0, 10); // Max 10 triggers
}

function extractEmotionalTriggers(
  emotionalHistory: any[],
  companionEvents: any[]
): { emotionalTriggers: string[]; positiveReinforcers: string[] } {
  const emotionalTriggers: string[] = [];
  const positiveReinforcers: string[] = [];
  const seenEmotional = new Set<string>();
  const seenPositive = new Set<string>();
  
  // From journal entries
  emotionalHistory.forEach(entry => {
    const mood = entry.mood;
    const state = entry.emotional_state;
    
    if (mood === 'stressed' || mood === 'overwhelmed') {
      const trigger = `${mood}_day`;
      if (!seenEmotional.has(trigger)) {
        emotionalTriggers.push(trigger);
        seenEmotional.add(trigger);
      }
    }
    
    if (mood === 'happy' || mood === 'excited') {
      const reinforcer = `${mood}_moment`;
      if (!seenPositive.has(reinforcer)) {
        positiveReinforcers.push(reinforcer);
        seenPositive.add(reinforcer);
      }
    }
  });
  
  // From companion events
  companionEvents.forEach(event => {
    const eventType = event.event_type;
    const payload = event.payload || {};
    
    if (eventType === 'task_completed' && !seenPositive.has('task_completion')) {
      positiveReinforcers.push('task_completion');
      seenPositive.add('task_completion');
    }
    
    if (eventType === 'streak_achieved' && !seenPositive.has('streak_milestone')) {
      positiveReinforcers.push('streak_milestone');
      seenPositive.add('streak_milestone');
    }
  });
  
  return {
    emotionalTriggers: emotionalTriggers.slice(0, 15),
    positiveReinforcers: positiveReinforcers.slice(0, 20)
  };
}

function buildStreakHistory(dailySessions: any[], tasks: any[]): any[] {
  const history: any[] = [];
  
  dailySessions.forEach(session => {
    if (session.reflection_wins || session.top_focus) {
      history.push({
        date: session.date,
        type: 'daily_session',
        value: 1
      });
    }
  });
  
  // Count consecutive completion days
  const completionDates = new Set(
    tasks
      .filter(t => t.completed && t.completed_at)
      .map(t => new Date(t.completed_at).toISOString().split('T')[0])
  );
  
  const sortedDates = Array.from(completionDates).sort();
  let currentStreak = 0;
  
  sortedDates.forEach((date, index) => {
    if (index === 0 || isConsecutiveDay(sortedDates[index - 1], date)) {
      currentStreak++;
    } else {
      if (currentStreak >= 3) {
        history.push({
          date: sortedDates[index - 1],
          type: 'completion_streak',
          value: currentStreak
        });
      }
      currentStreak = 1;
    }
  });
  
  if (currentStreak >= 3) {
    history.push({
      date: sortedDates[sortedDates.length - 1],
      type: 'completion_streak',
      value: currentStreak
    });
  }
  
  return history.slice(-50); // Keep last 50 entries
}

function isConsecutiveDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}
