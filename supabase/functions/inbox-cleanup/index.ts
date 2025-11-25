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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { tasks } = await req.json();

    if (!tasks || !Array.isArray(tasks)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tasks input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Build prompt for intelligent grouping
    const systemPrompt = `You are Malunita's inbox cleanup assistant. Analyze these inbox tasks and help the user batch-process them efficiently.

Your job:
1. Group similar tasks together (e.g., all errands, all emails, all planning tasks)
2. Identify quick wins (tasks that take < 5 minutes)
3. Suggest tasks that seem outdated or could be archived
4. Ask clarifying questions for ambiguous tasks

Return JSON in this format:
{
  "grouped_tasks": [
    {
      "group_title": "Short descriptive title",
      "reason": "Why these tasks are grouped together",
      "task_ids": ["id1", "id2"]
    }
  ],
  "quick_wins": [
    {
      "task_id": "id",
      "reason": "Why this is a quick win"
    }
  ],
  "archive_suggestions": [
    {
      "task_id": "id",
      "reason": "Why this could be archived (outdated, no longer relevant, etc.)"
    }
  ],
  "questions": [
    {
      "task_id": "id",
      "question": "Clarifying question about this task"
    }
  ]
}`;

    const taskList = tasks.map((t: any) => 
      `ID: ${t.id}\nTitle: ${t.title}\nCreated: ${t.created_at}\nCategory: ${t.category || 'inbox'}`
    ).join('\n\n');

    console.log(`Analyzing ${tasks.length} inbox tasks...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze these inbox tasks:\n\n${taskList}` }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    console.log('Inbox cleanup analysis complete');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in inbox-cleanup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze inbox';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
