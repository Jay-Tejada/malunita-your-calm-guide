import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("detect-patterns: Starting pattern detection");

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch last 14 days of ritual history
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data: rituals } = await supabaseClient
      .from('ritual_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', twoWeeksAgo.toISOString())
      .order('created_at', { ascending: false });

    // Fetch completed tasks from last 14 days
    const { data: completedTasks } = await supabaseClient
      .from('tasks')
      .select('title, category, completed_at, is_tiny_task')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('completed_at', twoWeeksAgo.toISOString());

    // Fetch current active tasks
    const { data: activeTasks } = await supabaseClient
      .from('tasks')
      .select('title, category, created_at')
      .eq('user_id', user.id)
      .eq('completed', false);

    // Build simple stats (no AI needed for basics)
    const morningRituals = rituals?.filter(r => r.type === 'morning').length || 0;
    const nightRituals = rituals?.filter(r => r.type === 'night').length || 0;
    const totalCompleted = completedTasks?.length || 0;
    const tinyTasksCompleted = completedTasks?.filter(t => t.is_tiny_task).length || 0;

    // Category breakdown
    const categoryCount: Record<string, number> = {};
    completedTasks?.forEach(t => {
      const cat = t.category || 'uncategorized';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const topCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // Completion by day of week
    const dayCount: Record<number, number> = {};
    completedTasks?.forEach(t => {
      if (t.completed_at) {
        const day = new Date(t.completed_at).getDay();
        dayCount[day] = (dayCount[day] || 0) + 1;
      }
    });

    const mostProductiveDay = Object.entries(dayCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const productiveDayName = mostProductiveDay ? dayNames[parseInt(mostProductiveDay)] : null;

    console.log("detect-patterns: Stats computed", { totalCompleted, morningRituals, nightRituals });

    // Only call AI if we have meaningful data
    if (totalCompleted < 3 && (rituals?.length || 0) < 2) {
      return new Response(
        JSON.stringify({
          has_patterns: false,
          observation: null,
          trend: 'unclear',
          stats: { 
            completed_last_14_days: totalCompleted, 
            tiny_tasks_completed: tinyTasksCompleted,
            morning_rituals: morningRituals, 
            night_rituals: nightRituals,
            top_category: topCategory,
            most_productive_day: productiveDayName,
            active_task_count: activeTasks?.length || 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate one simple observation with AI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const context = {
      completed_last_14_days: totalCompleted,
      tiny_tasks_completed: tinyTasksCompleted,
      morning_rituals: morningRituals,
      night_rituals: nightRituals,
      top_category: topCategory,
      most_productive_day: productiveDayName,
      active_task_count: activeTasks?.length || 0
    };

    console.log("OPENAI_CALL", "gpt-4o-mini", Date.now());

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You observe patterns. Return ONLY valid JSON, no markdown.

Output exactly:
{
  "observation": "One sentence. Neutral. Factual. No advice. No encouragement. Just pattern.",
  "trend": "improving | steady | declining | unclear"
}

Examples of good observations:
- "You complete more tasks on Tuesdays than any other day."
- "Most of your completed work is in the home category."
- "You've done morning rituals 5 of the last 7 days."
- "Tiny tasks make up 40% of your completions."

Never say "Great job" or give tips. Just observe.`
          },
          {
            role: 'user',
            content: JSON.stringify(context)
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    console.log("detect-patterns: Pattern detected", result);

    return new Response(
      JSON.stringify({
        has_patterns: true,
        observation: result.observation,
        trend: result.trend,
        stats: context
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('detect-patterns error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
