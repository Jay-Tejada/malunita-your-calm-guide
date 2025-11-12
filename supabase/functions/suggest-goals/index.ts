import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch user profile for patterns
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Fetch recent tasks (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (tasksError) throw tasksError;

    // Analyze task patterns
    const categories = tasks.map(t => t.category).filter(Boolean);
    const categoryFrequency = categories.reduce((acc: Record<string, number>, cat: string) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const completedTasks = tasks.filter(t => t.completed);
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length * 100).toFixed(0) : 0;

    // Build context for AI
    const taskSummary = tasks.slice(0, 20).map((t, i) => 
      `${i + 1}. ${t.title} [${t.category || 'uncategorized'}]${t.completed ? ' ✓' : ''}`
    ).join('\n');

    const topCategories = Object.entries(categoryFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([cat, count]) => `${cat} (${count} tasks)`)
      .join(', ');

    const systemPrompt = `You are an AI goal advisor analyzing a user's task history to suggest achievable, meaningful goals.

**User Activity Profile:**
- Total tasks (30 days): ${tasks.length}
- Completed: ${completedTasks.length} (${completionRate}%)
- Daily average: ${profile.average_tasks_per_day}
- Peak activity: ${profile.peak_activity_time}
- Top categories: ${topCategories || 'varied'}

**Recent Tasks:**
${taskSummary}

Based on this activity, suggest 4-5 specific, achievable goals the user could set. For each goal:
1. Make it concrete and measurable
2. Align it with their activity patterns
3. Consider their completion rate and task volume
4. Suggest a realistic timeframe (week/month/quarter)
5. Keep it motivating but achievable

Format your response as a JSON array with this structure:
{
  "suggestions": [
    {
      "goal": "Clear goal statement",
      "timeframe": "this_week" | "this_month" | "this_quarter",
      "reasoning": "Why this goal fits their patterns (1-2 sentences)",
      "category": "The main category this relates to"
    }
  ]
}`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Please analyze my tasks and suggest goals.' }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_goals",
              description: "Return 4-5 personalized goal suggestions based on task analysis",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        goal: { type: "string" },
                        timeframe: { 
                          type: "string",
                          enum: ["this_week", "this_month", "this_quarter"]
                        },
                        reasoning: { type: "string" },
                        category: { type: "string" }
                      },
                      required: ["goal", "timeframe", "reasoning", "category"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_goals" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Goal suggestion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
