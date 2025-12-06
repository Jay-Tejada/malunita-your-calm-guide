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

  console.log("analyze-inbox: Starting analysis");

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.log("analyze-inbox: Unauthorized - no user");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("analyze-inbox: User authenticated", user.id);

    // Fetch active tasks
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error("analyze-inbox: Error fetching tasks", tasksError);
      throw tasksError;
    }

    if (!tasks || tasks.length === 0) {
      console.log("analyze-inbox: No tasks found");
      return new Response(
        JSON.stringify({
          overdue: [],
          urgent: [],
          tiny_tasks: [],
          themes: [],
          task_count: 0,
          energy_estimate: 'low',
          top_focus: null,
          pattern: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("analyze-inbox: Found", tasks.length, "tasks");

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const now = new Date();
    const taskSummary = tasks.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      due: t.reminder_time,
      is_tiny: t.is_tiny_task,
      created: t.created_at
    }));

    console.log("analyze-inbox: Calling OpenAI");

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
            content: `You are an inbox analyzer. Return ONLY valid JSON, no markdown.
            
Analyze tasks and return:
{
  "overdue_ids": ["task ids past due"],
  "urgent_ids": ["task ids needing attention soon"],
  "tiny_task_ids": ["quick win task ids"],
  "themes": ["2-3 word theme labels"],
  "energy_estimate": "low | medium | high",
  "top_focus_id": "single most important task id or null",
  "pattern": "one sentence observation about the inbox state"
}

Be minimal. No advice. No encouragement. Just analysis.`
          },
          {
            role: 'user',
            content: `Current time: ${now.toISOString()}\n\nTasks:\n${JSON.stringify(taskSummary, null, 2)}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("analyze-inbox: OpenAI error", response.status, errorText);
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    console.log("analyze-inbox: OpenAI response received");
    
    let analysis;
    try {
      analysis = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error("analyze-inbox: Failed to parse AI response", data.choices[0].message.content);
      throw new Error('Failed to parse AI response');
    }

    // Enrich with full task objects
    const result = {
      overdue: tasks.filter(t => analysis.overdue_ids?.includes(t.id)),
      urgent: tasks.filter(t => analysis.urgent_ids?.includes(t.id)),
      tiny_tasks: tasks.filter(t => analysis.tiny_task_ids?.includes(t.id)),
      themes: analysis.themes || [],
      task_count: tasks.length,
      energy_estimate: analysis.energy_estimate || 'medium',
      top_focus: tasks.find(t => t.id === analysis.top_focus_id) || null,
      pattern: analysis.pattern || null
    };

    console.log("analyze-inbox: Analysis complete", {
      overdue: result.overdue.length,
      urgent: result.urgent.length,
      tiny_tasks: result.tiny_tasks.length,
      themes: result.themes.length
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('analyze-inbox error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
