import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tasks, context, userProfile } = await req.json();
    
    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No tasks provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    
    // Get user's preferred model - locked to gpt-4-turbo for all users
    const preferredModel = 'gpt-4-turbo';

    // Prepare task summary for AI
    const taskSummary = tasks.map((task: any, idx: number) => 
      `${idx + 1}. [${task.category || 'inbox'}] ${task.title}${task.context ? ` - ${task.context}` : ''}`
    ).join('\n');

    const systemPrompt = `You are a warm, minimalist productivity coach for solo creators. Your role is to help identify the 3-5 most important tasks to focus on today.

Guidelines:
- Choose tasks that balance urgency, importance, and momentum
- Prioritize time-sensitive items and quick wins
- Consider the user's energy and context
- Provide a brief, motivating reason for each pick (1 sentence max)
- Respond in a calm, supportive tone

Return your response as valid JSON in this exact format:
{
  "suggestions": [
    {
      "taskIndex": 0,
      "reason": "Brief motivating reason"
    }
  ],
  "message": "Optional encouraging message for the day"
}`;

    const userPrompt = `Here are the user's pending tasks:

${taskSummary}

${context ? `User context: "${context}"` : ''}

Based on this list, suggest 3-5 tasks to focus on today. Choose the task indices and provide a brief reason for each.`;

    console.log('Calling OpenAI for focus suggestions...');
    console.log('Using model:', preferredModel);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: preferredModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    console.log('AI suggestions:', aiResponse);

    return new Response(
      JSON.stringify(aiResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-focus:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestions';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
