import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch last 30 days of habit logs
    const { data: habitLogs, error: logsError } = await supabaseClient
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('completed_at', { ascending: false });

    if (logsError) throw logsError;

    if (!habitLogs || habitLogs.length < 5) {
      return new Response(JSON.stringify({
        prediction: null,
        message: "Not enough data to predict habits yet"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current context
    const now = new Date();
    const currentHour = now.getHours();
    const currentDayOfWeek = now.getDay();
    
    let currentTimeOfDay: string;
    if (currentHour >= 6 && currentHour < 12) currentTimeOfDay = 'morning';
    else if (currentHour >= 12 && currentHour < 17) currentTimeOfDay = 'afternoon';
    else if (currentHour >= 17 && currentHour < 22) currentTimeOfDay = 'evening';
    else currentTimeOfDay = 'night';

    // Build AI prompt for pattern analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a habit pattern analyzer. Analyze user task completion patterns and predict what they might want to do next.

Current context:
- Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayOfWeek]}
- Time of day: ${currentTimeOfDay}
- Hour: ${currentHour}

Historical patterns (last 30 days):
${habitLogs.slice(0, 50).map(log => 
  `- ${log.task_category} task on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][log.day_of_week]} ${log.time_of_day}: "${log.task_title}"`
).join('\n')}

Identify:
1. Repeating patterns at this time/day
2. Common task categories
3. Weekly rhythms
4. Consistency level (0-100)`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Based on the patterns, what should I predict the user might want to do right now? Provide category, confidence (0-1), and a friendly suggestion message.' }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'predict_habit',
            description: 'Return habit prediction',
            parameters: {
              type: 'object',
              properties: {
                predicted_category: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                suggestion: { type: 'string' },
                consistency_score: { type: 'number', minimum: 0, maximum: 100 }
              },
              required: ['predicted_category', 'confidence', 'suggestion', 'consistency_score'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'predict_habit' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI prediction failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({
        prediction: null,
        message: "No clear pattern detected"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prediction = JSON.parse(toolCall.function.arguments);

    // Find most recent incomplete task in predicted category
    const { data: incompleteTasks } = await supabaseClient
      .from('tasks')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('completed', false)
      .ilike('category', `%${prediction.predicted_category}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(JSON.stringify({
      prediction: {
        taskId: incompleteTasks?.[0]?.id,
        predictedCategory: prediction.predicted_category,
        confidence: prediction.confidence,
        suggestion: prediction.suggestion,
        consistencyScore: prediction.consistency_score
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in habit-predictor:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});