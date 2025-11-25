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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { task_ids } = await req.json();
    if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
      throw new Error('task_ids array is required');
    }

    // Fetch the selected tasks
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .in('id', task_ids)
      .eq('user_id', user.id);

    if (tasksError) throw tasksError;
    if (!tasks || tasks.length === 0) {
      throw new Error('No tasks found');
    }

    // Prepare text for analysis
    const tasksText = tasks.map(t => t.title).join('\n');

    // Call idea-analyzer to understand themes, dependencies, blockers
    const { data: analysis, error: analysisError } = await supabaseClient.functions.invoke('idea-analyzer', {
      body: { text: tasksText },
    });

    if (analysisError) {
      console.error('Error calling idea-analyzer:', analysisError);
    }

    // Use OpenAI to generate detailed plan with steps
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a planning assistant. Given a list of tasks, create a structured action plan with specific steps.

For each task, determine if it's "big" (needs breaking down) or "small" (can be done as-is).
For big tasks, generate 3-7 concrete steps.
For small tasks, just include them as-is.

Return a JSON object with:
- plan_title: brief title for the overall plan
- overall_goal: 1-2 sentence description of what this plan achieves
- estimated_load: "light", "moderate", or "heavy"
- steps: array of:
  - title: clear action step
  - suggested_category: "focus", "in-review", "someday", or "inbox"
  - suggested_timeframe: "today", "this week", "this month", or null
  - is_tiny: boolean (can be done in < 5 min)
  - parent_task_title: original task this step came from (if applicable)`;

    const userPrompt = `Tasks to plan:
${tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}

${analysis?.summary ? `Context: ${analysis.summary}` : ''}
${analysis?.themes ? `Themes: ${analysis.themes.join(', ')}` : ''}

Create a step-by-step plan.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate plan');
    }

    const aiData = await aiResponse.json();
    const planData = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify(planData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in plan-tasks:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
