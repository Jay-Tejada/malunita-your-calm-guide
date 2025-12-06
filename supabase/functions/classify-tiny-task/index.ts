import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskTitle, taskContext } = await req.json();

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: 'Task title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taskText = taskContext 
      ? `${taskTitle}\n${taskContext}` 
      : taskTitle;

    const systemPrompt = `You are Malunita, a warm minimalist productivity companion. Your goal is to identify whether a task is a 'Tiny Task Fiesta' task.

Tiny Tasks are actions that can be completed in under 5 minutes with low cognitive load.

Examples of Tiny Tasks:
- Pay a bill
- Reply to a simple email
- Confirm an appointment
- Send a document
- Check the status of something
- Renew a subscription or license
- File or organize a document
- Send a quick text or message
- Schedule a meeting
- Update a spreadsheet entry

NOT Tiny Tasks:
- Research projects
- Writing reports or articles
- Planning complex activities
- Long meetings
- Creative work
- Strategic thinking
- Learning new skills

Consider:
1. Duration: Can this be done in under 5 minutes?
2. Complexity: Is it a simple, straightforward action?
3. Cognitive load: Does it require deep thinking or just execution?
4. Steps: Is it a single action or multiple steps?

Respond with JSON only: { "is_tiny_task": boolean, "reason": string }

Use warm, calm language in your reasoning. Be encouraging but honest.`;

    console.log('Classifying task:', taskText);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Classify this task:\n\n${taskText}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI classification failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const classification = JSON.parse(data.choices[0].message.content);

    console.log('Classification result:', classification);

    return new Response(
      JSON.stringify(classification),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in classify-tiny-task function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
