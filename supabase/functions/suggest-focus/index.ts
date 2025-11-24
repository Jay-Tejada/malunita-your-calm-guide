import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🎯 suggest-focus function called');

    // JWT is already verified by platform (verify_jwt = true in config.toml)
    // Get user ID from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Extract user ID from JWT (already verified by platform)
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    console.log('✅ User ID from JWT:', userId);

    // Parse request body for location and companion mood context
    const body = await req.json().catch(() => ({}));
    const locationContext = body.location || null; // { lat, lng, context: 'home' | 'work' }
    const companionMood = body.companionMood || 'medium'; // 'ambitious' | 'medium' | 'simple' | 'low-cognitive'

    // Get user's profile for personalization and emotional state
    const { data: profile } = await supabase
      .from('profiles')
      .select('companion_name, current_goal, peak_activity_time, focus_preferences, emotional_memory')
      .eq('id', userId)
      .maybeSingle();

    const focusPreferences = profile?.focus_preferences || {};
    const seasonalWeight = (focusPreferences as any).seasonal_weight || {};
    const emotionalMemory = (profile?.emotional_memory as any) || { joy: 50, stress: 50, fatigue: 50, affection: 50 };

    // Context detection
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Time of day classification
    const isMorning = currentHour >= 6 && currentHour < 12;
    const isEarlyAfternoon = currentHour >= 12 && currentHour < 15;
    const isLateAfternoon = currentHour >= 15 && currentHour < 17;
    const isEvening = currentHour >= 17 && currentHour < 22;
    
    // Emotional state classification
    const isHighFatigue = emotionalMemory.fatigue >= 70;
    const isModerateFatigue = emotionalMemory.fatigue >= 50 && emotionalMemory.fatigue < 70;
    const isHighJoy = emotionalMemory.joy >= 70;
    const isHighStress = emotionalMemory.stress >= 70;
    
    console.log('📊 Context:', { 
      currentHour, 
      dayOfWeek, 
      isMorning, 
      isEarlyAfternoon,
      emotionalMemory,
      locationContext,
      companionMood
    });

    // Get all incomplete tasks with context
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(50);

    // Calculate cognitive load from task data
    const overdueCount = allTasks?.filter(t => {
      if (!t.reminder_time) return false;
      return new Date(t.reminder_time) < now;
    }).length || 0;
    
    const recentTaskCount = allTasks?.filter(t => {
      const createdAt = new Date(t.created_at);
      const minutesAgo = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      return minutesAgo <= 30;
    }).length || 0;
    
    // Cognitive load estimation (0-100)
    const cognitiveLoadScore = Math.min(
      (emotionalMemory.stress * 0.4) + 
      (overdueCount * 5) + 
      (recentTaskCount * 3) +
      (isHighFatigue ? 20 : 0),
      100
    );
    const isElevatedCognitiveLoad = cognitiveLoadScore >= 60;
    
    console.log('🧠 Cognitive load:', { score: cognitiveLoadScore, isElevated: isElevatedCognitiveLoad });

    // Categorize tasks
    const todayTasks = allTasks?.filter(t => t.category === 'today') || [];
    const upcomingTasks = allTasks?.filter(t => t.category === 'upcoming').slice(0, 5) || [];
    
    // Classify tasks by complexity (word count)
    const tinyTasks = allTasks?.filter(t => t.title.split(/\s+/).length <= 5) || [];
    const progressTasks = allTasks?.filter(t => 
      t.category === 'today' && 
      t.title.split(/\s+/).length > 5 && 
      t.title.split(/\s+/).length <= 10
    ) || [];
    
    // Get tasks with location data
    const locationRelevantTasks = locationContext 
      ? allTasks?.filter(t => {
          if (!t.location_lat || !t.location_lng) return false;
          // Calculate distance (simplified)
          const latDiff = Math.abs(t.location_lat - locationContext.lat);
          const lngDiff = Math.abs(t.location_lng - locationContext.lng);
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          return distance < 0.05; // ~5km radius
        }) || []
      : [];

    console.log('📊 Task breakdown:', { 
      total: allTasks?.length,
      today: todayTasks.length,
      tiny: tinyTasks.length, 
      progress: progressTasks.length,
      locationRelevant: locationRelevantTasks.length
    });

    // Fetch domino effect data for high-impact tasks
    let tasksWithUnlocks: any[] = [];
    if (isElevatedCognitiveLoad && allTasks && allTasks.length > 0) {
      const { data: dominoData } = await supabase.functions.invoke('analyze-domino-effect', {
        body: { 
          tasks: allTasks.slice(0, 10).map(t => ({ 
            id: t.id, 
            title: t.title, 
            category: t.category,
            keywords: t.keywords || []
          }))
        }
      }).catch(() => ({ data: null }));
      
      if (dominoData) {
        tasksWithUnlocks = Object.entries(dominoData).map(([id, unlocks]) => ({
          id,
          unlocks_count: unlocks,
          task: allTasks.find(t => t.id === id)
        })).sort((a, b) => (b.unlocks_count as number) - (a.unlocks_count as number));
      }
    }

    // Apply companion mood influence to task selection
    const applyCompanionMoodWeight = (tasks: any[]): any[] => {
      return tasks.map(task => {
        let moodBoost = 0;
        const taskComplexity = task.title.split(/\s+/).length; // Word count as proxy for complexity
        
        switch (companionMood) {
          case 'ambitious': // Joyful/Excited → favor challenging tasks
            if (taskComplexity > 8 && task.category === 'today') {
              moodBoost = 0.1;
            }
            break;
          case 'medium': // Calm/Neutral → balanced tasks
            if (taskComplexity >= 5 && taskComplexity <= 10) {
              moodBoost = 0.1;
            }
            break;
          case 'simple': // Worried → simple starter tasks
            if (taskComplexity <= 6) {
              moodBoost = 0.1;
            }
            break;
          case 'low-cognitive': // Sleepy → very simple tasks
            if (taskComplexity <= 5) {
              moodBoost = 0.1;
            }
            break;
        }
        
        return {
          ...task,
          moodBoost
        };
      });
    };

    // Context-aware task filtering and suggestion
    let suggestedTasks: any[] = [];
    let contextReason = '';

    // Rule 1: Morning + high fatigue → tiny starter tasks
    if (isMorning && isHighFatigue) {
      suggestedTasks = applyCompanionMoodWeight(tinyTasks).slice(0, 3);
      contextReason = 'morning_high_fatigue';
      console.log('🎯 Context rule: Morning + high fatigue → tiny tasks');
    }
    
    // Rule 2: Early afternoon + high joy → progress tasks
    else if (isEarlyAfternoon && isHighJoy) {
      suggestedTasks = applyCompanionMoodWeight(progressTasks).slice(0, 3);
      contextReason = 'afternoon_high_joy';
      console.log('🎯 Context rule: Early afternoon + high joy → progress tasks');
    }
    
    // Rule 3: Elevated cognitive load → tasks with highest unlocks_count
    else if (isElevatedCognitiveLoad && tasksWithUnlocks.length > 0) {
      const highImpactTasks = tasksWithUnlocks.slice(0, 3).map(t => t.task).filter(Boolean);
      suggestedTasks = applyCompanionMoodWeight(highImpactTasks);
      contextReason = 'high_cognitive_load';
      console.log('🎯 Context rule: Elevated cognitive load → high-impact tasks');
    }
    
    // Rule 4: Location context → location-relevant tasks
    else if (locationContext && locationRelevantTasks.length > 0) {
      suggestedTasks = applyCompanionMoodWeight(locationRelevantTasks).slice(0, 3);
      contextReason = `location_${locationContext.context || 'nearby'}`;
      console.log('🎯 Context rule: Location context → nearby tasks');
    }
    
    // Default: Time-based suggestions with seasonal and mood influence
    else {
      // Apply seasonal patterns
      let seasonalBoost: Record<string, number> = {};
      if (dayOfWeek === 1 && seasonalWeight.monday_reset) {
        seasonalBoost[seasonalWeight.monday_reset.category] = 0.2;
      } else if ((dayOfWeek === 0 || dayOfWeek === 6) && seasonalWeight.weekend_family) {
        seasonalBoost[seasonalWeight.weekend_family.category] = 0.2;
      }
      
      const baseTaskPool = todayTasks.length > 0 ? todayTasks : upcomingTasks;
      const tasksWithMood = applyCompanionMoodWeight(baseTaskPool);
      
      const tasksWithBoost = tasksWithMood.map(task => ({
        ...task,
        totalBoost: (seasonalBoost[task.category || ''] || 0) + (task.moodBoost || 0)
      }));
      
      suggestedTasks = tasksWithBoost
        .sort((a, b) => b.totalBoost - a.totalBoost)
        .slice(0, 3);
      contextReason = 'default_with_seasonal_and_mood';
    }

    console.log('🎭 Companion mood influence applied:', companionMood);

    // Generate contextual guidance message
    let message = '';
    const companionName = profile?.companion_name || 'Malunita';

    // Context-aware messaging
    if (isMorning && isHighFatigue && tinyTasks.length > 0) {
      message = `Good morning! I notice you're feeling tired. Let's start small with quick wins to build momentum. 🌅`;
    } else if (isEarlyAfternoon && isHighJoy && progressTasks.length > 0) {
      message = `You're feeling great! Perfect time to tackle those meaningful tasks and make real progress. ✨`;
    } else if (isElevatedCognitiveLoad && tasksWithUnlocks.length > 0) {
      const topTask = tasksWithUnlocks[0];
      message = `Feeling overwhelmed? Focus on "${topTask.task?.title}" - completing this unlocks ${topTask.unlocks_count} other tasks. 🎯`;
    } else if (locationContext && locationRelevantTasks.length > 0) {
      message = `You're at ${locationContext.context || 'a new location'}! Here are tasks you can do here. 📍`;
    } else if (todayTasks.length > 0) {
      if (isMorning) {
        message = `Good morning! ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} ready for today. Let's make it count! ☀️`;
      } else if (isLateAfternoon) {
        message = `You're doing great! ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} remaining. Keep the momentum! 🚀`;
      } else if (isEvening) {
        message = `Evening focus! ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} left. Almost there! 🌙`;
      }
    } else if (upcomingTasks.length > 0) {
      message = `All caught up! ${upcomingTasks.length} upcoming task${upcomingTasks.length > 1 ? 's' : ''} when you're ready. 🎯`;
    } else {
      message = isMorning 
        ? `Fresh start! What would you like to accomplish? ${companionName} is here. ☀️`
        : `Peaceful moment. Add tasks or reflect on your day. 🌸`;
    }

    console.log('💬 Generated message:', message);
    console.log('🎯 Suggested tasks:', suggestedTasks.map(t => t?.title));

    return new Response(
      JSON.stringify({ 
        message,
        suggestedTasks: suggestedTasks.map(t => ({
          id: t?.id,
          title: t?.title,
          category: t?.category
        })),
        context: {
          timeOfDay: isMorning ? 'morning' : isEarlyAfternoon ? 'early_afternoon' : isLateAfternoon ? 'late_afternoon' : isEvening ? 'evening' : 'other',
          dayOfWeek,
          emotionalState: {
            fatigue: emotionalMemory.fatigue,
            joy: emotionalMemory.joy,
            stress: emotionalMemory.stress
          },
          cognitiveLoad: cognitiveLoadScore,
          companionMood,
          contextReason
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in suggest-focus:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate guidance';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
