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
    const { text, userProfile } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const systemPrompt = `You are Malunita, a smart voice productivity assistant for solo creators. Your job is to extract actionable tasks from natural, unfiltered voice input.

Guidelines:
- Extract 1-3 clear, actionable tasks maximum
- Clean up rambling or vague language into clear task titles
- Suggest appropriate categories: inbox, work, home, projects, gym
- Suggest timeframes: today, this_week, later
- Create friendly confirmation prompts for each task
- If the input is just a question or comment (not a task), return empty tasks array

${userProfile?.peak_activity_time ? `User's peak activity time: ${userProfile.peak_activity_time}` : ''}
${userProfile?.common_prefixes?.length > 0 ? `User often uses these prefixes: ${userProfile.common_prefixes.join(', ')}` : ''}

Return valid JSON in this exact format:
{
  "tasks": [
    {
      "title": "Clear task title",
      "suggested_category": "work",
      "suggested_timeframe": "today",
      "confidence": 0.85,
      "confirmation_prompt": "Should I add this to Work for today?"
    }
  ],
  "conversation_reply": "Optional friendly reply if no tasks were found"
}`;

    console.log('Extracting tasks from:', text);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
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
    const result = JSON.parse(data.choices[0].message.content);

    console.log('Extracted tasks:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract tasks';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
