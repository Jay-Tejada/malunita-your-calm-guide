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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error in malunita-personal-feed:', userError, {
        hasToken: !!token,
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating personal feed for user: ${user.id}`);

    // Pull last 50 completed tasks from task_history
    const { data: taskHistory, error: historyError } = await supabaseClient
      .from('task_history')
      .select('task_text, completed_at, category, sentiment, difficulty, emotional_context')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(50);

    if (historyError) {
      console.error('Error fetching task history:', historyError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch task history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!taskHistory || taskHistory.length === 0) {
      return new Response(
        JSON.stringify({ 
          insight: "Your journey is just beginning! Complete your first tasks to unlock personalized insights.",
          pattern: null,
          flashback: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${taskHistory.length} completed tasks`);

    // Prepare data summary for AI
    const taskSummary = taskHistory.map(t => ({
      task: t.task_text,
      category: t.category,
      difficulty: t.difficulty,
      sentiment: t.sentiment,
      date: t.completed_at
    }));

    // Call Lovable AI to analyze patterns
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are Malunita, a warm and encouraging AI companion analyzing a user's task completion history. 
Generate personal insights in a friendly, motivational tone. Be specific about their accomplishments and patterns.
Keep each insight to 1-3 short sentences maximum.`
          },
          {
            role: 'user',
            content: `Analyze these ${taskHistory.length} completed tasks and generate:

Task History:
${JSON.stringify(taskSummary, null, 2)}

Generate THREE insights:
1. "insight" - A celebration of recent accomplishments or progress (be specific about what they achieved)
2. "pattern" - An observation about their work patterns, habits, or consistency (focus on positive patterns or gentle nudges)
3. "flashback" - A motivational callback to an earlier achievement or a reminder of their capabilities

Keep each insight warm, personal, and under 2 sentences. Use "you" and "your".`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_personal_feed",
              description: "Generate personalized insights from task history",
              parameters: {
                type: "object",
                properties: {
                  insight: {
                    type: "string",
                    description: "Celebration of recent accomplishments (1-2 sentences)"
                  },
                  pattern: {
                    type: "string",
                    description: "Observation about work patterns or habits (1-2 sentences)"
                  },
                  flashback: {
                    type: "string",
                    description: "Motivational callback to earlier achievements (1-2 sentences)"
                  }
                },
                required: ["insight", "pattern", "flashback"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_personal_feed" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('No tool call in AI response');
    }

    const feedData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(feedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in malunita-personal-feed:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        insight: "I'm having trouble generating your insights right now. Your progress is still amazing!",
        pattern: null,
        flashback: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});