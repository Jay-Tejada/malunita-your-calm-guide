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
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load all incomplete tasks for the user
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, category, context, reminder_time, is_focus, created_at, updated_at')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error loading tasks:', tasksError);
      return new Response(
        JSON.stringify({ error: 'Failed to load tasks' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({
          top_priority: null,
          must_do: [],
          should_do: [],
          could_do: [],
          quick_wins: [],
          blocked: [],
          warnings: ['No incomplete tasks found'],
          day_theme: 'Free day',
          reasoning: 'No tasks to prioritize'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare tasks for OpenAI
    const taskList = tasks.map((t, i) => 
      `${i + 1}. ${t.title}${t.category ? ` [${t.category}]` : ''}${t.context ? ` - ${t.context}` : ''}`
    ).join('\n');

    const systemPrompt = `You are Malunita, an AI productivity partner.
Given the user's tasks, create a daily plan with:

- top_priority: string (the ONE thing they must do today, based on urgency + impact)
- must_do: string[]
- should_do: string[]
- could_do: string[]
- quick_wins: string[] (tiny tasks under 5 min)
- blocked: string[] (tasks requiring someone else)
- warnings: string[] (deadlines, overload, contradictions)
- day_theme: string (short phrase like "Clear the decks", "Money day", "Admin reset")
- reasoning: string (brief explanation)

Return ONLY valid JSON matching this structure. No markdown, no code blocks.`;

    const userPrompt = `Here are the user's incomplete tasks:\n\n${taskList}\n\nCreate a prioritized daily plan.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate daily plan' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    let plan;
    try {
      plan = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(plan),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in daily-prioritization function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
