import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskSuggestion {
  taskId: string;
  suggestion: 'today' | 'someday' | 'work' | 'home' | 'gym';
  confidence: number;
  reason?: string;
}

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Batch categorizing inbox for user: ${user.id}`);

    // Fetch inbox tasks
    const { data: inboxTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, created_at, is_time_based, has_reminder, ai_metadata')
      .eq('user_id', user.id)
      .eq('completed', false)
      .eq('category', 'inbox')
      .order('created_at', { ascending: false })
      .limit(20);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw new Error('Failed to fetch inbox tasks');
    }

    if (!inboxTasks || inboxTasks.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${inboxTasks.length} inbox tasks...`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the prompt for batch categorization
    const taskList = inboxTasks.map((task, idx) => 
      `${idx + 1}. [ID: ${task.id}] ${task.title}`
    ).join('\n');

    const systemPrompt = `You are an AI assistant that categorizes tasks into destinations.

For each task, suggest ONE of these destinations:
- "today" - urgent, time-sensitive, high-priority tasks that should be done today
- "someday" - ideas, low-priority, non-urgent tasks to do later
- "work" - work-related, professional, career tasks
- "home" - personal life, errands, household, family tasks
- "gym" - fitness, exercise, workout, sports tasks

Consider:
- Tasks with deadlines or time words → "today"
- Work/professional keywords → "work"
- Personal/household keywords → "home"
- Fitness/exercise keywords → "gym"
- Vague ideas or "maybe" → "someday"

Return ONLY a JSON array with this structure:
[
  {
    "taskId": "<task_id>",
    "suggestion": "today" | "someday" | "work" | "home" | "gym",
    "confidence": 0.0 to 1.0,
    "reason": "brief explanation"
  }
]`;

    const userPrompt = `Categorize these tasks:\n\n${taskList}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let suggestions: TaskSuggestion[];
    try {
      const parsed = JSON.parse(content);
      // Handle both array response and object with array property
      suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      suggestions = [];
    }

    console.log(`Generated ${suggestions.length} suggestions`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in batch-categorize-inbox:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to categorize tasks';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
